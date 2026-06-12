"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { checkForbiddenContent } from "@/lib/forbidden-content";
import type { ConversationPreview, MessageRow } from "@/lib/types";

/**
 * Envoyer un message dans une conversation.
 * - Le sender doit être connecté
 * - Le recipient doit être l'autre partie de la conversation pour cette annonce
 * - Détection téléphone/email pour empêcher de contourner les jetons
 */
export async function sendMessageAction(formData: FormData): Promise<
  { ok: true; message: MessageRow } | { ok: false; error: string }
> {
  const user = await requireUser();
  const admin = createAdminClient();

  const propertyId = String(formData.get("propertyId") ?? "");
  const recipientId = String(formData.get("recipientId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!propertyId || !recipientId)
    return { ok: false, error: "Conversation invalide." };
  if (!content) return { ok: false, error: "Message vide." };
  if (content.length > 2000)
    return { ok: false, error: "Message trop long (2000 caractères max)." };
  if (recipientId === user.id)
    return { ok: false, error: "Impossible de s'envoyer un message." };

  // Vérifier que l'annonce existe et que recipient est soit le propriétaire,
  // soit a déjà débloqué le contact
  const { data: property } = await admin
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .single();
  if (!property) return { ok: false, error: "Annonce introuvable." };

  const userIsOwner = property.owner_id === user.id;
  const otherIsOwner = property.owner_id === recipientId;

  if (!userIsOwner && !otherIsOwner)
    return { ok: false, error: "L'un des participants doit être le propriétaire." };

  // Vérifier le déblocage : si user n'est pas owner, il doit avoir débloqué
  if (!userIsOwner) {
    const { data: unlock } = await admin
      .from("unlock_records")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (!unlock)
      return {
        ok: false,
        error: "Débloquez d'abord le contact pour envoyer un message.",
      };
  }

  // Anti-bypass : pas de coordonnées dans les messages
  const check = checkForbiddenContent(content);
  if (!check.ok)
    return {
      ok: false,
      error: `Coordonnées détectées dans le message ("${check.found}"). Utilisez les boutons d'appel et email après déblocage.`,
    };

  const { data, error } = await admin
    .from("messages")
    .insert({
      property_id: propertyId,
      sender_id: user.id,
      recipient_id: recipientId,
      content,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[sendMessage]", error);
    return { ok: false, error: "Erreur lors de l'envoi." };
  }

  revalidatePath(`/messages/${propertyId}/${recipientId}`);
  revalidatePath("/messages");
  return { ok: true, message: data };
}

/**
 * Liste les conversations de l'utilisateur, groupées par (annonce + autre user).
 */
export async function listConversations(): Promise<ConversationPreview[]> {
  const user = await requireUser();
  const admin = createAdminClient();

  // Récupère tous les messages où je suis impliqué
  const { data: msgs } = await admin
    .from("messages")
    .select(
      "id, property_id, sender_id, recipient_id, content, read_at, created_at, properties!inner(title, property_photos(url, display_order))",
    )
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!msgs) return [];

  // Grouper par clé "propertyId|otherUserId"
  const groups = new Map<string, any>();
  for (const m of msgs as any[]) {
    const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
    const key = `${m.property_id}|${otherId}`;
    if (!groups.has(key)) {
      const cover = (m.properties.property_photos ?? []).sort(
        (a: any, b: any) => a.display_order - b.display_order,
      )[0];
      groups.set(key, {
        property_id: m.property_id,
        property_title: m.properties.title,
        property_cover: cover?.url ?? null,
        other_user_id: otherId,
        last_message: m.content,
        last_message_at: m.created_at,
        unread_count: 0,
      });
    }
    const group = groups.get(key);
    if (m.recipient_id === user.id && !m.read_at) group.unread_count += 1;
  }

  // Récupérer les noms des autres utilisateurs
  const otherIds = Array.from(groups.values()).map((g) => g.other_user_id);
  if (otherIds.length === 0) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", otherIds);
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return Array.from(groups.values())
    .map((g) => ({ ...g, other_user_name: nameMap.get(g.other_user_id) ?? "Utilisateur" }))
    .sort(
      (a, b) =>
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime(),
    );
}

/**
 * Récupère une conversation complète et marque les messages comme lus.
 */
export async function getConversation(
  propertyId: string,
  otherUserId: string,
): Promise<{
  messages: MessageRow[];
  property: { id: string; title: string; cover: string | null };
  other_user: { id: string; full_name: string };
} | null> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: messages } = await admin
    .from("messages")
    .select("*")
    .eq("property_id", propertyId)
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`,
    )
    .order("created_at", { ascending: true });

  // Marquer comme lus (ceux que j'ai reçus)
  await admin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("property_id", propertyId)
    .eq("sender_id", otherUserId)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  // Récupérer les infos de l'annonce + autre user
  const [propRes, otherRes] = await Promise.all([
    admin
      .from("properties")
      .select("id, title, property_photos(url, display_order)")
      .eq("id", propertyId)
      .single(),
    admin.from("profiles").select("id, full_name").eq("id", otherUserId).single(),
  ]);

  if (!propRes.data || !otherRes.data) return null;

  const cover = (propRes.data.property_photos ?? []).sort(
    (a: any, b: any) => a.display_order - b.display_order,
  )[0];

  return {
    messages: (messages ?? []) as MessageRow[],
    property: {
      id: propRes.data.id,
      title: propRes.data.title,
      cover: cover?.url ?? null,
    },
    other_user: otherRes.data,
  };
}
