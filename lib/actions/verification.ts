"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, requireRole } from "@/lib/auth";

// ============================================================================
// CÔTÉ PROPRIÉTAIRE : faire une demande de vérification
// ============================================================================
export async function requestVerificationAction(
  propertyId: string,
  ownerNote?: string,
): Promise<{ ok: true; cost: number; isFree: boolean } | { ok: false; error: string }> {
  const user = await requireUser();
  const admin = createAdminClient();

  // 1. Vérifier l'annonce
  const { data: property } = await admin
    .from("properties")
    .select("id, owner_id, status, is_verified")
    .eq("id", propertyId)
    .single();
  if (!property) return { ok: false, error: "Annonce introuvable." };
  if (property.owner_id !== user.id && !user.roles.includes("admin"))
    return { ok: false, error: "Non autorisé." };
  if (property.is_verified)
    return { ok: false, error: "Cette annonce est déjà vérifiée." };
  if (property.status !== "active")
    return { ok: false, error: "L'annonce doit être active pour être vérifiée." };

  // 2. Vérifier qu'il n'y a pas déjà une demande pending
  const { data: existing } = await admin
    .from("verification_requests")
    .select("id")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing)
    return {
      ok: false,
      error: "Une demande est déjà en cours. Patientez.",
    };

  // 3. Lire les paramètres globaux
  const { data: settings } = await admin
    .from("site_settings")
    .select("verification_cost, free_mode_until")
    .eq("id", 1)
    .single();

  const isFreeMode = settings?.free_mode_until
    ? new Date(settings.free_mode_until).getTime() > Date.now()
    : false;
  const cost = isFreeMode ? 0 : settings?.verification_cost ?? 10;

  // 4. Débiter les jetons si pas gratuit
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
    if (debitErr) return { ok: false, error: "Erreur lors du débit. Réessayez." };

    // Log audit
    await admin.from("token_adjustments").insert({
      user_id: user.id,
      delta: -cost,
      reason: "unlock_spent",
      note: `Demande vérification annonce ${propertyId}`,
      performed_by: user.id,
    });
  }

  // 5. Créer la demande
  const { error: insertErr } = await admin
    .from("verification_requests")
    .insert({
      property_id: propertyId,
      owner_id: user.id,
      status: "pending",
      tokens_used: cost,
      owner_note: ownerNote || null,
    });

  if (insertErr) {
    // Si l'insert échoue, on rembourse les jetons
    if (cost > 0) {
      await admin
        .from("profiles")
        .update({ tokens_balance: user.tokens_balance })
        .eq("id", user.id);
    }
    console.error("[requestVerification]", insertErr);
    return { ok: false, error: "Erreur lors de la création de la demande." };
  }

  revalidatePath(`/property/${propertyId}`);
  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/admin");
  revalidatePath("/", "layout"); // pour le compteur jetons dans le header

  return { ok: true, cost, isFree: isFreeMode };
}

// ============================================================================
// CÔTÉ PROPRIÉTAIRE : récupérer le statut de la demande
// ============================================================================
export async function getVerificationStatus(propertyId: string): Promise<{
  status: "none" | "pending" | "approved" | "rejected";
  admin_note?: string | null;
  created_at?: string;
}> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("verification_requests")
    .select("status, admin_note, created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { status: "none" };
  return {
    status: data.status,
    admin_note: data.admin_note,
    created_at: data.created_at,
  };
}

// ============================================================================
// CÔTÉ ADMIN : liste des demandes
// ============================================================================
export async function listVerificationRequests() {
  await requireRole("admin");
  const admin = createAdminClient();

  const { data } = await admin
    .from("verification_requests")
    .select(
      "*, properties!inner(id, title, city, property_type, listing_type, price, property_photos(url, display_order)), profiles!verification_requests_owner_id_fkey(full_name, email, phone)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return data ?? [];
}

// ============================================================================
// CÔTÉ ADMIN : approuver
// ============================================================================
export async function approveVerificationAction(
  requestId: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireRole("admin");
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("verification_requests")
    .select("*")
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

  // Accorder le badge vert
  await admin
    .from("properties")
    .update({ is_verified: true })
    .eq("id", request.property_id);

  revalidatePath("/", "layout");
  revalidatePath(`/property/${request.property_id}`);
  revalidatePath("/dashboard/admin/verifications");

  return { ok: true };
}

// ============================================================================
// CÔTÉ ADMIN : refuser (avec option de remboursement)
// ============================================================================
export async function rejectVerificationAction(
  requestId: string,
  note: string,
  refundTokens: boolean = true,
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireRole("admin");
  if (!note || note.length < 3)
    return { ok: false, error: "Motif requis (3 caractères min)." };

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("verification_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (!request) return { ok: false, error: "Demande introuvable." };
  if (request.status !== "pending")
    return { ok: false, error: "Déjà traitée." };

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

  // Rembourser les jetons si demandé
  if (refundTokens && request.tokens_used > 0) {
    const { data: profile } = await admin
      .from("profiles")
      .select("tokens_balance")
      .eq("id", request.owner_id)
      .single();
    if (profile) {
      await admin
        .from("profiles")
        .update({ tokens_balance: profile.tokens_balance + request.tokens_used })
        .eq("id", request.owner_id);

      await admin.from("token_adjustments").insert({
        user_id: request.owner_id,
        delta: request.tokens_used,
        reason: "refund",
        note: `Remboursement demande vérification refusée`,
        performed_by: me.id,
      });
    }
  }

  revalidatePath("/dashboard/admin/verifications");
  return { ok: true };
}
