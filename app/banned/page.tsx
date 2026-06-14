import Link from "next/link";
import { ShieldX } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BannedPage() {
  // Récupérer la raison du ban si possible (le user est en cours de signout mais le cookie peut subsister)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let reason: string | null = null;
  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("ban_reason")
      .eq("id", user.id)
      .single();
    reason = profile?.ban_reason ?? null;

    // Force le signout côté serveur
    await supabase.auth.signOut();
  }

  const { data: settings } = await createAdminClient()
    .from("site_settings")
    .select("support_email")
    .eq("id", 1)
    .single();
  const supportEmail = settings?.support_email ?? null;

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
      <div className="inline-flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <ShieldX className="size-8" />
      </div>

      <h1 className="font-display text-3xl sm:text-4xl italic mb-3 text-destructive">
        Compte suspendu
      </h1>

      <p className="text-sm text-muted-foreground mb-6">
        Votre compte Vohitra a été suspendu par un administrateur. Vous ne
        pouvez plus accéder à la plateforme.
      </p>

      {reason && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-6 text-left">
          <p className="text-[10px] uppercase tracking-widest font-bold text-destructive mb-1">
            Motif
          </p>
          <p className="text-sm text-foreground">{reason}</p>
        </div>
      )}

      {supportEmail && (
        <p className="text-xs text-muted-foreground mb-6">
          Pour contester cette décision, contactez-nous à{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="text-primary hover:underline"
          >
            {supportEmail}
          </a>
        </p>
      )}

      <Link
        href="/"
        className="inline-block min-h-12 px-6 py-3 bg-muted hover:bg-muted/70 rounded-lg text-sm font-semibold transition-colors"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
