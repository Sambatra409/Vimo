import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ImageOff } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { titleCase } from "@/lib/format";
import { ConversationView } from "./conversation-view";

interface Props {
  params: Promise<{ propertyId: string; otherId: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConversationPage({ params }: Props) {
  const { propertyId, otherId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/messages/${propertyId}/${otherId}`);

  const admin = createAdminClient();

  const [propRes, otherRes, messagesRes] = await Promise.all([
    admin
      .from("properties")
      .select("id, title, property_photos(url, display_order)")
      .eq("id", propertyId)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id, full_name")
      .eq("id", otherId)
      .maybeSingle(),
    admin
      .from("messages")
      .select("*")
      .eq("property_id", propertyId)
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`,
      )
      .order("created_at", { ascending: true }),
  ]);

  // Diagnostic en cas d'erreur
  if (!propRes.data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/messages" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="size-4" /> Retour
        </Link>
        <div className="bg-destructive/10 border border-destructive rounded-2xl p-5">
          <h2 className="font-bold text-destructive mb-2">Annonce introuvable</h2>
          <p className="text-sm">L'annonce que vous essayez de contacter n'existe plus ou a été supprimée.</p>
          <p className="text-xs mt-2 font-mono text-muted-foreground">ID: {propertyId}</p>
        </div>
      </div>
    );
  }

  if (!otherRes.data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/messages" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="size-4" /> Retour
        </Link>
        <div className="bg-destructive/10 border border-destructive rounded-2xl p-5">
          <h2 className="font-bold text-destructive mb-2">Utilisateur introuvable</h2>
          <p className="text-sm">Ce propriétaire n'a pas (ou plus) de profil sur Vohitra.</p>
          <p className="text-xs mt-2 font-mono text-muted-foreground">ID: {otherId}</p>
        </div>
      </div>
    );
  }

  // Marquer comme lus
  await admin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("property_id", propertyId)
    .eq("sender_id", otherId)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  const cover = (propRes.data.property_photos ?? []).sort(
    (a: any, b: any) => a.display_order - b.display_order,
  )[0];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="size-4" /> Toutes les conversations
      </Link>

      <header className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-3">
        <div className="relative size-12 shrink-0 rounded-xl overflow-hidden bg-muted">
          {cover ? (
            <Image src={cover.url} alt={propRes.data.title} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-4" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{titleCase(otherRes.data.full_name)}</p>
          <Link
            href={`/property/${propertyId}`}
            className="text-xs text-muted-foreground hover:text-primary truncate block"
          >
            {titleCase(propRes.data.title)} →
          </Link>
        </div>
      </header>

      <ConversationView
        currentUserId={user.id}
        propertyId={propertyId}
        otherUserId={otherId}
        initialMessages={(messagesRes.data ?? []) as any}
      />
    </div>
  );
}
