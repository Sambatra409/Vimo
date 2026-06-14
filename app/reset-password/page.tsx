import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./reset-form";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    error_description?: string;
  }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();

  // Cas 1 : erreur déjà dans l'URL (lien expiré ou déjà utilisé)
  if (sp.error_description) {
    return (
      <ErrorView
        title="Lien invalide"
        message={sp.error_description}
      />
    );
  }

  // Cas 2 : nouveau flow PKCE (Supabase moderne) → ?code=xxx
  if (sp.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(sp.code);
    if (error) {
      return (
        <ErrorView
          title="Lien expiré"
          message="Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien."
        />
      );
    }
  }
  // Cas 3 : ancien flow → ?token_hash=xxx&type=recovery
  else if (sp.token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: sp.token_hash,
    });
    if (error) {
      return (
        <ErrorView
          title="Lien expiré"
          message="Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien."
        />
      );
    }
  }
  // Cas 4 : aucun code dans l'URL → vérifier si déjà connecté
  else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/forgot-password");
    }
  }

  // Tout est bon, on affiche le formulaire
  return <ResetForm />;
}

function ErrorView({ title, message }: { title: string; message: string }) {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
      <h1 className="font-display text-3xl italic mb-3 text-destructive">{title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{message}</p>
      <Link
        href="/forgot-password"
        className="inline-block min-h-12 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90"
      >
        Redemander un lien
      </Link>
    </div>
  );
}
