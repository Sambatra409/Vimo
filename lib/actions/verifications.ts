"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, requireRole } from "@/lib/auth";

// ============================================================================
// CÔTÉ PROPRIÉTAIRE
// ============================================================================

/**
 * Demande de vérification pour une annonce.
 * Débite les jetons (sauf mode gratuit).
 */
export async function requestVerificationAction(
  propertyId: string,
  userMessage: string,
): Promise<
  | { ok: true; cost: number; isFree: boolean }
  | { ok: false; error: string }
> {
  const user = await requireUser();
  const admin = createAdminClient();

  // Vérifier la propriété
  const { data: property } = await admin
    .from("properties")
    .select("owner_id, status, is_verified")
    .eq("id", propertyId)
    .single();

  if (!property) return { ok: false, error: "Annonce introuvable." };
  if (property.owner_id !== user.id)
    return { ok: false, error: "Vous n'êtes pas le propriétaire." };
  if (property.status !== "active")
    return { ok: false, error: "L'annonce doit être active pour être vérifiée." };
  if (property.is_verified)
    return { ok: false, error: "Cette annonce est déjà vérifiée." };

  // Vérifier qu'il n'y a pas déjà une demande pending
  const { data: existing } = await admin
    .from("verification_requests")
    .select("id, status")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing)
    return { ok: false, error: "Une demande est déjà en cours pour cette annonce." };

  // Lire les paramètres : coût + mode gratuit
  const { data: settings } = await admin
    .from("site_settings")
    .select("verification_cost, free_mode_until")
    .eq("id", 1)
    .single();

  const isFreeMode = settings?.free_mode_until
    ? new Date(settings.free_mode_until).getTime() > Date.now()
    : false;
  const cost = isFreeMode ? 0 : settings?.verification_cost ?? 10;

  // Débit jetons si nécessaire
  if (cost > 0) {
    if (user.tokens_balance < cost) {
      return {
        ok: false,
        error: `Solde insuffisant : ${cost} jetons requis (vous en avez ${user.tokens_balance}).`,
      };
    }
    const { error: debitErr } = await admin
      .from("profiles")
      .update({ tokens_balance: user.tokens_balance - cost })
      .eq("id", user.id)
      .eq("tokens_balance", user.tokens_balance);
    if (debitErr) return { ok: false, error: "Erreur de débit. Réessayez." };

    // Log audit
    await admin.from("token_adjustments").insert({
      user_id: user.id,
      delta: -cost,
      reason: "unlock_spent",
      note: `Demande de vérification annonce`,
      performed_by: user.id,
    });
  }

  // Créer la demande
  const { error: insertErr } = await admin
    .from("verification_requests")
    .insert({
      property_id: propertyId,
      requested_by: user.id,
      status: "pending",
      tokens_paid: cost,
      user_message: userMessage?.trim() || null,
    });

  if (insertErr) {
    console.error("[requestVerification]", insertErr);
    // Tenter de rembourser
    if (cost > 0) {
      await admin
        .from("profiles")
        .update({ tokens_balance: user.tokens_balance })
        .eq("id", user.id);
    }
    return { ok: false, error: "Erreur lors de l'enregistrement. Vos jetons ont été remboursés." };
  }

  revalidatePath(`/property/${propertyId}`);
  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/admin/verifications");
  return { ok: true, cost, isFree: isFreeMode };
}

/**
 * Récupère le statut de vérification d'une annonce pour son propriétaire.
 */
export async function getVerificationStatus(propertyId: string): Promise<{
  hasPending: boolean;
  lastRequest:
    | {
        status: "pending" | "approved" | "rejected" | "cancelled";
        admin_note: string | null;
        created_at: string;
        validated_at: string | null;
      }
    | null;
}> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("verification_requests")
    .select("status, admin_note, created_at, validated_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    hasPending: data?.status === "pending",
    lastRequest: data ?? null,
  };
}

/**
 * Annulation par le propriétaire (rembourse les jetons).
 */
export async function cancelVerificationAction(
  propertyId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("verification_requests")
    .select("id, requested_by, status, tokens_paid")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .single();
  if (!request) return { ok: false, error: "Aucune demande en cours." };
  if (request.requested_by !== user.id)
    return { ok: false, error: "Non autorisé." };

  // Annuler
  await admin
    .from("verification_requests")
    .update({ status: "cancelled" })
    .eq("id", request.id);

  // Rembourser les jetons
  if (request.tokens_paid > 0) {
    const { data: profile } = await admin
      .from("profiles")
      .select("tokens_balance")
      .eq("id", user.id)
      .single();
    if (profile) {
      await admin
        .from("profiles")
        .update({ tokens_balance: profile.tokens_balance + request.tokens_paid })
        .eq("id", user.id);

      await admin.from("token_adjustments").insert({
        user_id: user.id,
        delta: request.tokens_paid,
        reason: "refund",
        note: "Annulation demande vérification",
        performed_by: user.id,
      });
    }
  }

  revalidatePath(`/property/${propertyId}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================================
// CÔTÉ ADMIN
// ============================================================================

export async function listVerificationRequests() {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("verification_requests")
    .select(
      "*, properties!inner(id, title, city, property_type, address, property_photos(url, display_order)), profiles!verification_requests_requested_by_fkey(full_name, email, phone)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function approveVerificationAction(
  requestId: string,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireRole("admin");
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("verification_requests")
    .select("id, property_id, status")
    .eq("id", requestId)
    .single();
  if (!request) return { ok: false, error: "Demande introuvable." };
  if (request.status !== "pending")
    return { ok: false, error: `Déjà traitée (statut: ${request.status}).` };

  // Marquer approuvée
  await admin
    .from("verification_requests")
    .update({
      status: "approved",
      admin_note: note || null,
      validated_by: me.id,
      validated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  // Donner le badge vert à l'annonce
  await admin
    .from("properties")
    .update({ is_verified: true })
    .eq("id", request.property_id);

  revalidatePath("/", "layout");
  revalidatePath(`/property/${request.property_id}`);
  revalidatePath("/dashboard/admin/verifications");
  return { ok: true };
}

export async function rejectVerificationAction(
  requestId: string,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireRole("admin");
  if (!note || note.length < 5)
    return { ok: false, error: "Motif de refus requis (5 caractères min)." };

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("verification_requests")
    .select("id, status, requested_by, tokens_paid")
    .eq("id", requestId)
    .single();
  if (!request) return { ok: false, error: "Introuvable." };
  if (request.status !== "pending") return { ok: false, error: "Déjà traitée." };

  // Marquer refusée
  await admin
    .from("verification_requests")
    .update({
      status: "rejected",
      admin_note: note,
      validated_by: me.id,
      validated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  // Rembourser les jetons en cas de refus (geste commercial)
  if (request.tokens_paid > 0) {
    const { data: profile } = await admin
      .from("profiles")
      .select("tokens_balance")
      .eq("id", request.requested_by)
      .single();
    if (profile) {
      await admin
        .from("profiles")
        .update({ tokens_balance: profile.tokens_balance + request.tokens_paid })
        .eq("id", request.requested_by);

      await admin.from("token_adjustments").insert({
        user_id: request.requested_by,
        delta: request.tokens_paid,
        reason: "refund",
        note: `Refus vérification annonce`,
        performed_by: me.id,
      });
    }
  }

  revalidatePath("/dashboard/admin/verifications");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function incrementContactAttemptAction(
  requestId: string,
): Promise<{ ok: boolean }> {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data: r } = await admin
    .from("verification_requests")
    .select("contact_attempts")
    .eq("id", requestId)
    .single();
  if (!r) return { ok: false };
  await admin
    .from("verification_requests")
    .update({ contact_attempts: (r.contact_attempts ?? 0) + 1 })
    .eq("id", requestId);
  revalidatePath("/dashboard/admin/verifications");
  return { ok: true };
}
