"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { checkForbiddenContent } from "@/lib/forbidden-content";
import type {
  PropertyType,
  ListingType,
  PropertyStatus,
  PropertyStats,
} from "@/lib/types";

interface PropertyInput {
  title: string;
  description: string;
  property_type: PropertyType;
  listing_type: ListingType;
  price: number;
  surface: number;
  rooms: number | null;
  address: string;
  city: string;
  postal_code: string | null;
  photos: string[]; // URLs déjà uploadées
  status?: PropertyStatus;
}

function validatePropertyInput(
  input: Partial<PropertyInput>,
): { ok: true; data: PropertyInput } | { ok: false; error: string } {
  if (!input.title || input.title.trim().length < 5)
    return { ok: false, error: "Le titre doit faire au moins 5 caractères." };
  if (input.title.length > 120)
    return { ok: false, error: "Le titre est trop long (120 max)." };
  if (!input.description || input.description.trim().length < 20)
    return { ok: false, error: "La description doit faire au moins 20 caractères." };
  if (input.description.length > 5000)
    return { ok: false, error: "Description trop longue." };

  // Détecter les téléphones/emails dans titre + description
  const titleCheck = checkForbiddenContent(input.title);
  if (!titleCheck.ok)
    return {
      ok: false,
      error: `Le titre ne doit pas contenir de coordonnées ("${titleCheck.found}").`,
    };
  const descCheck = checkForbiddenContent(input.description);
  if (!descCheck.ok)
    return {
      ok: false,
      error: `La description ne doit pas contenir de coordonnées ("${descCheck.found}").`,
    };

  if (!input.property_type) return { ok: false, error: "Type de bien requis." };
  if (!input.listing_type) return { ok: false, error: "Type de transaction requis." };
  if (!input.price || input.price <= 0) return { ok: false, error: "Prix invalide." };
  if (!input.surface || input.surface <= 0)
    return { ok: false, error: "Surface invalide." };
  if (!input.address || input.address.trim().length < 5)
    return { ok: false, error: "Adresse requise (5 caractères minimum)." };
  if (!input.city || input.city.trim().length < 2)
    return { ok: false, error: "Ville requise." };
  if (!input.photos || input.photos.length === 0)
    return { ok: false, error: "Ajoutez au moins une photo." };
  if (input.photos.length > 5)
    return { ok: false, error: "Maximum 5 photos autorisées." };

  return {
    ok: true,
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      property_type: input.property_type,
      listing_type: input.listing_type,
      price: input.price,
      surface: input.surface,
      rooms: input.rooms ?? null,
      address: input.address.trim(),
      city: input.city.trim(),
      postal_code: input.postal_code?.trim() || null,
      photos: input.photos,
      status: input.status ?? "active",
    },
  };
}

// ============================================================================
// CREATE PROPERTY
// ============================================================================
export async function createPropertyAction(
  input: Partial<PropertyInput>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.roles.includes("proprietaire") && !user.roles.includes("admin"))
    return { ok: false, error: "Réservé aux propriétaires." };

  const valid = validatePropertyInput(input);
  if (!valid.ok) return valid;

  const admin = createAdminClient();
  const { data: property, error } = await admin
    .from("properties")
    .insert({
      owner_id: user.id,
      title: valid.data.title,
      description: valid.data.description,
      property_type: valid.data.property_type,
      listing_type: valid.data.listing_type,
      price: valid.data.price,
      surface: valid.data.surface,
      rooms: valid.data.rooms,
      address: valid.data.address,
      city: valid.data.city,
      postal_code: valid.data.postal_code,
      status: valid.data.status,
    })
    .select("id")
    .single();

  if (error || !property) {
    console.error("[createProperty]", error);
    return { ok: false, error: "Erreur lors de la création." };
  }

  // Insérer les photos
  const photoRows = valid.data.photos.map((url, idx) => ({
    property_id: property.id,
    url,
    display_order: idx,
  }));
  await admin.from("property_photos").insert(photoRows);

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/owner");
  return { ok: true, id: property.id };
}

// ============================================================================
// UPDATE PROPERTY
// ============================================================================
export async function updatePropertyAction(
  propertyId: string,
  input: Partial<PropertyInput>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const admin = createAdminClient();

  // Vérifier la propriété
  const { data: existing } = await admin
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .single();

  if (!existing) return { ok: false, error: "Annonce introuvable." };
  if (existing.owner_id !== user.id && !user.roles.includes("admin"))
    return { ok: false, error: "Non autorisé." };

  const valid = validatePropertyInput(input);
  if (!valid.ok) return valid;

  // Update champs
  await admin
    .from("properties")
    .update({
      title: valid.data.title,
      description: valid.data.description,
      property_type: valid.data.property_type,
      listing_type: valid.data.listing_type,
      price: valid.data.price,
      surface: valid.data.surface,
      rooms: valid.data.rooms,
      address: valid.data.address,
      city: valid.data.city,
      postal_code: valid.data.postal_code,
      status: valid.data.status,
      // Modification importante => repasser en non-vérifié pour re-validation
      is_verified: false,
    })
    .eq("id", propertyId);

  // Remplacer toutes les photos
  await admin.from("property_photos").delete().eq("property_id", propertyId);
  const photoRows = valid.data.photos.map((url, idx) => ({
    property_id: propertyId,
    url,
    display_order: idx,
  }));
  await admin.from("property_photos").insert(photoRows);

  revalidatePath("/", "layout");
  revalidatePath(`/property/${propertyId}`);
  revalidatePath("/dashboard/owner");
  return { ok: true };
}

// ============================================================================
// DELETE PROPERTY
// ============================================================================
export async function deletePropertyAction(
  propertyId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .single();
  if (!existing) return { ok: false, error: "Introuvable." };
  if (existing.owner_id !== user.id && !user.roles.includes("admin"))
    return { ok: false, error: "Non autorisé." };

  await admin.from("properties").delete().eq("id", propertyId);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/owner");
  return { ok: true };
}

// ============================================================================
// TOGGLE STATUS (pause / réactivation)
// ============================================================================
export async function togglePropertyStatusAction(
  propertyId: string,
  newStatus: PropertyStatus,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .single();
  if (!existing) return { ok: false, error: "Introuvable." };
  if (existing.owner_id !== user.id) return { ok: false, error: "Non autorisé." };

  await admin
    .from("properties")
    .update({ status: newStatus })
    .eq("id", propertyId);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/owner");
  return { ok: true };
}

// ============================================================================
// GET PROPERTY FOR OWNER (édition)
// ============================================================================
export async function getPropertyForOwner(propertyId: string) {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data } = await admin
    .from("properties")
    .select("*, property_photos(url, display_order)")
    .eq("id", propertyId)
    .single();

  if (!data) return null;
  if (data.owner_id !== user.id && !user.roles.includes("admin")) return null;

  const photos = (data.property_photos ?? []).sort(
    (a: any, b: any) => a.display_order - b.display_order,
  );
  return { ...data, photos };
}

// ============================================================================
// GET PROPERTY STATS
// ============================================================================
export async function getPropertyStats(
  propertyId: string,
): Promise<PropertyStats | null> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: prop } = await admin
    .from("properties")
    .select("owner_id, view_count")
    .eq("id", propertyId)
    .single();

  if (!prop) return null;
  if (prop.owner_id !== user.id && !user.roles.includes("admin")) return null;

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Comptages parallèles
  const [v7Res, v30Res, unlocksRes, favsRes, msgsRes, recentUnlocksRes, viewsByDayRes] =
    await Promise.all([
      admin
        .from("property_views")
        .select("id", { count: "exact", head: true })
        .eq("property_id", propertyId)
        .gte("viewed_at", d7),
      admin
        .from("property_views")
        .select("id", { count: "exact", head: true })
        .eq("property_id", propertyId)
        .gte("viewed_at", d30),
      admin
        .from("unlock_records")
        .select("id", { count: "exact", head: true })
        .eq("property_id", propertyId),
      admin
        .from("favorites")
        .select("property_id", { count: "exact", head: true })
        .eq("property_id", propertyId),
      admin
        .from("messages")
        .select("sender_id")
        .eq("property_id", propertyId),
      admin
        .from("unlock_records")
        .select("user_id, unlocked_at, profiles!inner(full_name, email)")
        .eq("property_id", propertyId)
        .order("unlocked_at", { ascending: false })
        .limit(10),
      admin
        .from("property_views")
        .select("viewed_at")
        .eq("property_id", propertyId)
        .gte("viewed_at", d30)
        .order("viewed_at"),
    ]);

  // Agréger les vues par jour
  const dayMap = new Map<string, number>();
  for (const v of viewsByDayRes.data ?? []) {
    const day = (v.viewed_at as string).slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const views_by_day = Array.from(dayMap.entries())
    .sort()
    .map(([day, count]) => ({ day, count }));

  // Conversations uniques = nombre de sender_ids uniques
  const uniqueSenders = new Set(
    (msgsRes.data ?? []).map((m: any) => m.sender_id),
  );

  const views_total = prop.view_count ?? 0;
  const unlocks_total = unlocksRes.count ?? 0;

  return {
    views_total,
    views_7d: v7Res.count ?? 0,
    views_30d: v30Res.count ?? 0,
    unlocks_total,
    favorites_total: favsRes.count ?? 0,
    messages_total: uniqueSenders.size,
    conversion_rate:
      views_total > 0 ? Math.round((unlocks_total / views_total) * 1000) / 10 : 0,
    recent_unlocks: (recentUnlocksRes.data ?? []).map((r: any) => ({
      user_name: r.profiles?.full_name ?? "Anonyme",
      user_email_masked: maskEmail(r.profiles?.email ?? ""),
      unlocked_at: r.unlocked_at,
    })),
    views_by_day,
  };
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.min(5, user.length - 2))}@${domain}`;
}
