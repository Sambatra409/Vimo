"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

/** Helper : récupère les profiles correspondant à une liste d'user_ids */
async function fetchProfilesMap(userIds: string[]) {
  if (userIds.length === 0) return new Map();
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, tokens_balance")
    .in("id", userIds);
  return new Map((data ?? []).map((p: any) => [p.id, p]));
}

// ============================================================================
// GESTION UTILISATEURS
// ============================================================================
export async function listAllUsers(search?: string) {
  await requireRole("admin");
  const admin = createAdminClient();

  // 1. Récupérer les profils
  let qy = admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (search && search.trim())
    qy = qy.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data: profiles } = await qy;
  if (!profiles || profiles.length === 0) return [];

  // 2. Récupérer les rôles séparément
  const ids = profiles.map((p) => p.id);
  const { data: rolesData } = await admin
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", ids);

  const rolesMap = new Map<string, string[]>();
  for (const r of rolesData ?? []) {
    const arr = rolesMap.get(r.user_id) ?? [];
    arr.push(r.role);
    rolesMap.set(r.user_id, arr);
  }

  return profiles.map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    tokens_balance: p.tokens_balance,
    is_banned: p.is_banned ?? false,
    is_kyc_verified: p.is_kyc_verified,
    roles: rolesMap.get(p.id) ?? [],
    created_at: p.created_at,
  }));
}

export async function banUserAction(userId: string, reason: string) {
  const me = await requireRole("admin");
  if (userId === me.id) return { ok: false, error: "Vous ne pouvez pas vous bannir." };
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ is_banned: true, ban_reason: reason || "Sans motif" })
    .eq("id", userId);
  await admin
    .from("properties")
    .update({ status: "paused" })
    .eq("owner_id", userId);
  revalidatePath("/dashboard/admin/users");
  return { ok: true };
}

export async function unbanUserAction(userId: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ is_banned: false, ban_reason: null })
    .eq("id", userId);
  revalidatePath("/dashboard/admin/users");
  return { ok: true };
}

export async function adjustTokensAction(userId: string, delta: number, note: string) {
  const me = await requireRole("admin");
  if (delta === 0 || !Number.isInteger(delta))
    return { ok: false, error: "Delta invalide." };
  if (Math.abs(delta) > 1000)
    return { ok: false, error: "Maximum ±1000 jetons par opération." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("tokens_balance")
    .eq("id", userId)
    .single();
  if (!profile) return { ok: false, error: "Utilisateur introuvable." };

  const newBalance = profile.tokens_balance + delta;
  if (newBalance < 0) return { ok: false, error: "Solde négatif interdit." };

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ tokens_balance: newBalance })
    .eq("id", userId)
    .eq("tokens_balance", profile.tokens_balance);
  if (updateErr) return { ok: false, error: "Conflit, réessayez." };

  await admin.from("token_adjustments").insert({
    user_id: userId,
    delta,
    reason: delta > 0 ? "admin_grant" : "admin_revoke",
    note: note || null,
    performed_by: me.id,
  });

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleUserRoleAction(
  userId: string,
  role: "locataire" | "proprietaire" | "admin",
  action: "add" | "remove",
) {
  const me = await requireRole("admin");
  if (userId === me.id && role === "admin" && action === "remove")
    return { ok: false, error: "Vous ne pouvez pas retirer votre propre rôle admin." };

  const admin = createAdminClient();
  try {
    if (action === "add") {
      await admin.from("user_roles").insert({ user_id: userId, role });
    } else {
      await admin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
    }
  } catch {}
  revalidatePath("/dashboard/admin/users");
  return { ok: true };
}

// ============================================================================
// VALIDATION DES ACHATS DE JETONS
// ============================================================================
export async function listAllPurchases() {
  await requireRole("admin");
  const admin = createAdminClient();

  // 1. Récupérer les achats
  const { data: purchases } = await admin
    .from("token_purchases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!purchases || purchases.length === 0) return [];

  // 2. Récupérer les profils séparément
  const userIds = [...new Set(purchases.map((p) => p.user_id))];
  const profilesMap = await fetchProfilesMap(userIds);

  return purchases.map((p: any) => ({
    ...p,
    profiles: profilesMap.get(p.user_id) ?? null,
  }));
}

export async function approvePurchaseAction(purchaseId: string, note: string) {
  const me = await requireRole("admin");
  const admin = createAdminClient();

  const { data: purchase } = await admin
    .from("token_purchases")
    .select("*")
    .eq("id", purchaseId)
    .single();
  if (!purchase) return { ok: false, error: "Achat introuvable." };
  if (purchase.status !== "pending")
    return { ok: false, error: `Déjà traité (statut: ${purchase.status}).` };

  await admin
    .from("token_purchases")
    .update({
      status: "approved",
      admin_note: note || null,
      validated_by: me.id,
      validated_at: new Date().toISOString(),
    })
    .eq("id", purchaseId);

  const { data: profile } = await admin
    .from("profiles")
    .select("tokens_balance")
    .eq("id", purchase.user_id)
    .single();
  if (profile) {
    await admin
      .from("profiles")
      .update({ tokens_balance: profile.tokens_balance + purchase.pack_size })
      .eq("id", purchase.user_id);

    await admin.from("token_adjustments").insert({
      user_id: purchase.user_id,
      delta: purchase.pack_size,
      reason: "purchase_approved",
      note: `Achat ${purchase.payment_reference}`,
      performed_by: me.id,
      related_purchase_id: purchase.id,
    });
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/purchases");
  revalidatePath("/tokens");
  return { ok: true };
}

export async function rejectPurchaseAction(purchaseId: string, note: string) {
  const me = await requireRole("admin");
  if (!note || note.length < 3)
    return { ok: false, error: "Motif de refus requis (3 caractères min)." };
  const admin = createAdminClient();
  const { data: purchase } = await admin
    .from("token_purchases")
    .select("status")
    .eq("id", purchaseId)
    .single();
  if (!purchase) return { ok: false, error: "Introuvable." };
  if (purchase.status !== "pending") return { ok: false, error: "Déjà traité." };

  await admin
    .from("token_purchases")
    .update({
      status: "rejected",
      admin_note: note,
      validated_by: me.id,
      validated_at: new Date().toISOString(),
    })
    .eq("id", purchaseId);
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/purchases");
  revalidatePath("/tokens");
  return { ok: true };
}

// ============================================================================
// PARAMÈTRES GLOBAUX
// ============================================================================
export async function getSettings() {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();
  return data;
}

export async function updateSettingsAction(formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();

  const updates: any = {
    unlock_cost: Number(formData.get("unlock_cost")) || 1,
    unlock_cost_rent: Number(formData.get("unlock_cost_rent")) || 1,
    unlock_cost_sale: Number(formData.get("unlock_cost_sale")) || 1,
    verification_cost: Number(formData.get("verification_cost")) || 10,
    boost_cost: Number(formData.get("boost_cost")) || 5,
    boost_duration_days: Number(formData.get("boost_duration_days")) || 7,
    free_unlocks_per_day: Number(formData.get("free_unlocks_per_day")) || 0,
    purchase_instructions: String(formData.get("purchase_instructions") ?? "").trim(),
    site_name: String(formData.get("site_name") ?? "Vohitra").trim(),
    support_email: String(formData.get("support_email") ?? "").trim(),
    support_phone: String(formData.get("support_phone") ?? "").trim(),
  };

  const freeModeDays = Number(formData.get("free_mode_days")) || 0;
  if (freeModeDays > 0) {
    updates.free_mode_until = new Date(
      Date.now() + freeModeDays * 24 * 60 * 60 * 1000,
    ).toISOString();
  } else if (formData.get("clear_free_mode") === "on") {
    updates.free_mode_until = null;
  }

  await admin.from("site_settings").update(updates).eq("id", 1);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/admin/settings");
  return { ok: true };
}

// ============================================================================
// TOKEN PACKS
// ============================================================================
export async function listAllPacks() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("token_packs")
    .select("*")
    .order("display_order");
  return data ?? [];
}

export async function updatePackAction(packId: string, formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  const price_ar = Number(formData.get("price_ar"));
  const size = Number(formData.get("size"));
  const label = String(formData.get("label") ?? "").trim() || null;
  const badge = String(formData.get("badge") ?? "").trim() || null;
  const is_active = formData.get("is_active") === "on";

  if (!price_ar || price_ar <= 0) return { ok: false, error: "Prix invalide." };
  if (!size || size <= 0 || !Number.isInteger(size))
    return { ok: false, error: "Nombre de jetons invalide (doit être un entier > 0)." };
  if (size > 10000)
    return { ok: false, error: "Maximum 10 000 jetons par pack." };

  // Vérifier qu'aucun autre pack n'a déjà cette taille
  const { data: existing } = await admin
    .from("token_packs")
    .select("id")
    .eq("size", size)
    .neq("id", packId)
    .maybeSingle();
  if (existing) return { ok: false, error: `Un autre pack a déjà ${size} jetons. Choisissez une taille différente.` };

  const { error } = await admin
    .from("token_packs")
    .update({ price_ar, size, label, badge, is_active })
    .eq("id", packId);
  if (error) {
    console.error("[updatePackAction] error:", error);
    return { ok: false, error: "Erreur technique." };
  }
  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/tokens");
  return { ok: true };
}

// Créer un nouveau pack
export async function createPackAction(formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  const price_ar = Number(formData.get("price_ar"));
  const size = Number(formData.get("size"));
  const label = String(formData.get("label") ?? "").trim() || null;
  const badge = String(formData.get("badge") ?? "").trim() || null;

  if (!price_ar || price_ar <= 0) return { ok: false, error: "Prix invalide." };
  if (!size || size <= 0 || !Number.isInteger(size))
    return { ok: false, error: "Nombre de jetons invalide." };

  // Vérifier l'unicité de size
  const { data: existing } = await admin
    .from("token_packs")
    .select("id")
    .eq("size", size)
    .maybeSingle();
  if (existing) return { ok: false, error: `Un pack avec ${size} jetons existe déjà.` };

  // Calculer le display_order = max actuel + 1
  const { data: maxOrder } = await admin
    .from("token_packs")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("token_packs").insert({
    size,
    price_ar,
    label,
    badge,
    display_order: (maxOrder?.display_order ?? 0) + 1,
    is_active: true,
  });
  if (error) {
    console.error("[createPackAction] error:", error);
    return { ok: false, error: "Erreur technique." };
  }
  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/tokens");
  return { ok: true };
}

// Supprimer un pack
export async function deletePackAction(packId: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  await admin.from("token_packs").delete().eq("id", packId);
  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/tokens");
  return { ok: true };
}

// ============================================================================
// VUE D'ENSEMBLE
// ============================================================================
export async function getAdminOverview() {
  await requireRole("admin");
  const admin = createAdminClient();

  const [usersRes, propRes, ownersRes, tenantsRes, tokensRes, pendingRes, verifPendingRes] =
    await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("properties").select("id", { count: "exact", head: true }).eq("status", "active"),
      admin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "proprietaire"),
      admin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "locataire"),
      admin.from("profiles").select("tokens_balance"),
      admin.from("token_purchases").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  const tokensInCirculation = (tokensRes.data ?? []).reduce(
    (sum: number, p: any) => sum + (p.tokens_balance ?? 0),
    0,
  );

  return {
    total_users: usersRes.count ?? 0,
    total_owners: ownersRes.count ?? 0,
    total_tenants: tenantsRes.count ?? 0,
    active_properties: propRes.count ?? 0,
    tokens_in_circulation: tokensInCirculation,
    pending_purchases: pendingRes.count ?? 0,
    pending_verifications: verifPendingRes.count ?? 0,
  };
}

// ============================================================================
// LISTE ANNONCES (admin voit tout)
// ============================================================================
export async function listAllPropertiesForAdmin(search?: string) {
  await requireRole("admin");
  const admin = createAdminClient();

  // 1. Récupérer les annonces
  let qy = admin
    .from("properties")
    .select("id, title, city, price, listing_type, property_type, status, is_premium, is_verified, view_count, created_at, owner_id")
    .order("created_at", { ascending: false })
    .limit(100);
  if (search && search.trim()) qy = qy.ilike("title", `%${search}%`);
  const { data: properties } = await qy;
  if (!properties || properties.length === 0) return [];

  // 2. Récupérer les profils des propriétaires séparément
  const ownerIds = [...new Set(properties.map((p) => p.owner_id))];
  const profilesMap = await fetchProfilesMap(ownerIds);

  return properties.map((p: any) => ({
    ...p,
    profiles: profilesMap.get(p.owner_id) ?? null,
  }));
}

export async function adminDeletePropertyAction(propertyId: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  await admin.from("properties").delete().eq("id", propertyId);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/admin/properties");
  return { ok: true };
}

export async function adminToggleVerifiedAction(propertyId: string, verified: boolean) {
  await requireRole("admin");
  const admin = createAdminClient();
  await admin
    .from("properties")
    .update({ is_verified: verified })
    .eq("id", propertyId);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/admin/properties");
  return { ok: true };
}

// Changer le statut d'une annonce depuis l'admin (active, paused, sold)
export async function adminChangeStatusAction(
  propertyId: string,
  newStatus: "active" | "paused" | "sold",
) {
  await requireRole("admin");
  const admin = createAdminClient();

  const { data: current } = await admin
    .from("properties")
    .select("status")
    .eq("id", propertyId)
    .single();
  if (!current) return { ok: false, error: "Annonce introuvable." };

  const updates: any = { status: newStatus };
  if (newStatus === "sold" && current.status !== "sold") {
    updates.sold_at = new Date().toISOString();
  }
  if (newStatus !== "sold" && current.status === "sold") {
    updates.sold_at = null;
  }

  await admin.from("properties").update(updates).eq("id", propertyId);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/admin/properties");
  revalidatePath(`/property/${propertyId}`);
  return { ok: true };
}
