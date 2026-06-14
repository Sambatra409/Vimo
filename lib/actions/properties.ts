"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, requireUser } from "@/lib/auth";
import type {
  PropertyListItem,
  PropertyFull,
  OwnerContact,
  SearchFilters,
} from "@/lib/types";

const PAGE_SIZE = 12;

// ============================================================================
// SEARCH — public, lecture seule
// ============================================================================
export async function searchProperties(
  filters: SearchFilters,
): Promise<{ items: PropertyListItem[]; hasMore: boolean }> {
  const admin = createAdminClient();
  const page = filters.page ?? 0;
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let qy = admin
    .from("properties")
    .select(
      "id, title, city, surface, price, rooms, property_type, listing_type, is_premium, premium_until, is_verified, property_photos(url, display_order)",
    )
    .eq("status", "active")
    // 1. Premium en premier (boostés)
    .order("is_premium", { ascending: false })
    .order("premium_until", { ascending: false, nullsFirst: false })
    // 2. Puis ordre pseudo-aléatoire stable (pas d'avantage à l'ancienneté)
    .order("id", { ascending: false })
    .range(from, to);

  if (filters.type) qy = qy.eq("property_type", filters.type);
  if (filters.listing) qy = qy.eq("listing_type", filters.listing);
  if (filters.city) qy = qy.ilike("city", `%${filters.city}%`);
  if (filters.pmin && filters.pmin > 0) qy = qy.gte("price", filters.pmin);
  if (filters.pmax && filters.pmax > 0) qy = qy.lte("price", filters.pmax);
  if (filters.smin && filters.smin > 0) qy = qy.gte("surface", filters.smin);
  if (filters.rooms && filters.rooms > 0) qy = qy.gte("rooms", filters.rooms);
  if (filters.q) qy = qy.ilike("title", `%${filters.q}%`);

  const { data, error } = await qy;
  if (error) {
    console.error("[searchProperties]", error);
    return { items: [], hasMore: false };
  }

  const items: PropertyListItem[] = (data ?? []).map((p: any) => {
    const photos = (p.property_photos ?? []).sort(
      (a: any, b: any) => a.display_order - b.display_order,
    );
    return {
      id: p.id,
      title: p.title,
      city: p.city,
      surface: p.surface,
      price: p.price,
      rooms: p.rooms,
      property_type: p.property_type,
      listing_type: p.listing_type,
      is_premium: p.is_premium,
      is_verified: p.is_verified,
      cover_url: photos[0]?.url ?? null,
    };
  });

  return { items, hasMore: items.length === PAGE_SIZE };
}

// ============================================================================
// GET BY ID — public, lecture seule
// ============================================================================
export async function getPropertyById(id: string): Promise<PropertyFull | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("properties")
    .select(
      "*, property_photos(url, display_order)",
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !data) return null;

  const photos = (data.property_photos ?? []).sort(
    (a: any, b: any) => a.display_order - b.display_order,
  );

  return {
    id: data.id,
    owner_id: data.owner_id,
    title: data.title,
    description: data.description,
    city: data.city,
    address: data.address,
    postal_code: data.postal_code,
    contact_phone_1: data.contact_phone_1,
    contact_phone_2: data.contact_phone_2,
    surface: data.surface,
    price: data.price,
    rooms: data.rooms,
    property_type: data.property_type,
    listing_type: data.listing_type,
    status: data.status,
    is_premium: data.is_premium,
    premium_until: data.premium_until,
    is_verified: data.is_verified,
    view_count: data.view_count,
    created_at: data.created_at,
    updated_at: data.updated_at,
    cover_url: photos[0]?.url ?? null,
    photos: photos.map((p: any) => ({ url: p.url, display_order: p.display_order })),
  };
}

// ============================================================================
// UNLOCK CONTACT — ⚠️ Server Action sensible (débit jeton)
// ============================================================================
export async function unlockContactAction(propertyId: string): Promise<
  | { ok: true; owner: OwnerContact; alreadyUnlocked: boolean }
  | { ok: false; error: string }
> {
  // 1. Vérifier l'authentification
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const admin = createAdminClient();

  // 2. Vérifier que l'annonce existe et n'appartient pas à l'utilisateur
  const { data: property } = await admin
    .from("properties")
    .select("id, owner_id, status")
    .eq("id", propertyId)
    .single();

  if (!property) return { ok: false, error: "Annonce introuvable." };
  if (property.status !== "active") return { ok: false, error: "Annonce non disponible." };
  if (property.owner_id === user.id)
    return { ok: false, error: "C'est votre propre annonce." };

  // 3. Vérifier si déjà débloqué (pas de re-facturation)
  const { data: existingUnlock } = await admin
    .from("unlock_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (existingUnlock) {
    // Déjà débloqué, on renvoie juste les coordonnées
    const owner = await fetchOwnerContact(admin, property.owner_id);
    if (!owner) return { ok: false, error: "Coordonnées indisponibles." };
    return { ok: true, owner, alreadyUnlocked: true };
  }

  // 4. Lire les paramètres globaux : mode gratuit + coût + free unlocks par jour
  const { data: settings } = await admin
    .from("site_settings")
    .select("unlock_cost, free_mode_until, free_unlocks_per_day")
    .eq("id", 1)
    .single();

  const isFreeMode = settings?.free_mode_until
    ? new Date(settings.free_mode_until).getTime() > Date.now()
    : false;

  // Compter les déblocages des dernières 24h (glissant)
  let freeUnlocksUsedToday = 0;
  const freeUnlocksPerDay = settings?.free_unlocks_per_day ?? 0;
  if (!isFreeMode && freeUnlocksPerDay > 0) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("unlock_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("unlocked_at", since);
    freeUnlocksUsedToday = count ?? 0;
  }

  const hasFreeUnlockLeft =
    !isFreeMode && freeUnlocksPerDay > 0 && freeUnlocksUsedToday < freeUnlocksPerDay;

  const cost = isFreeMode || hasFreeUnlockLeft ? 0 : (settings?.unlock_cost ?? 1);

  // 5. Si pas gratuit : vérifier les jetons + débiter
  if (cost > 0) {
    if (user.tokens_balance < cost) {
      return {
        ok: false,
        error: `Solde insuffisant : ${cost} jeton(s) requis (vous en avez ${user.tokens_balance}).`,
      };
    }

    // Débit atomique via RPC (à créer) ou requête conditionnelle
    const { error: debitError } = await admin
      .from("profiles")
      .update({ tokens_balance: user.tokens_balance - cost })
      .eq("id", user.id)
      .eq("tokens_balance", user.tokens_balance); // CAS optimiste : évite la double dépense

    if (debitError) {
      console.error("[unlockContact] débit échoué", debitError);
      return { ok: false, error: "Erreur lors du débit. Réessayez." };
    }
  }

  // 6. Enregistrer le déblocage
  const { error: insertError } = await admin
    .from("unlock_records")
    .insert({ user_id: user.id, property_id: propertyId, tokens_used: cost });

  if (insertError) {
    console.error("[unlockContact] insert échoué", insertError);
    return { ok: false, error: "Erreur lors de l'enregistrement." };
  }

  // 7. Récupérer + retourner les coordonnées
  const owner = await fetchOwnerContact(admin, property.owner_id);
  if (!owner) return { ok: false, error: "Coordonnées indisponibles." };

  revalidatePath(`/property/${propertyId}`);
  revalidatePath("/", "layout"); // pour mettre à jour le compteur jetons dans le header

  return { ok: true, owner, alreadyUnlocked: false };
}

async function fetchOwnerContact(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
): Promise<OwnerContact | null> {
  const { data } = await admin
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", ownerId)
    .single();
  return data;
}

// ============================================================================
// CHECK UNLOCKED — public mais filtré par user
// ============================================================================
export async function isContactUnlocked(propertyId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("unlock_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();
  return !!data;
}

// ============================================================================
// TOGGLE FAVORITE
// ============================================================================
export async function toggleFavoriteAction(
  propertyId: string,
): Promise<{ ok: true; isFavorite: boolean } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("favorites")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (existing) {
    await admin
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", propertyId);
    revalidatePath("/favorites");
    return { ok: true, isFavorite: false };
  } else {
    await admin
      .from("favorites")
      .insert({ user_id: user.id, property_id: propertyId });
    revalidatePath("/favorites");
    return { ok: true, isFavorite: true };
  }
}

export async function isFavorited(propertyId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("favorites")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();
  return !!data;
}

// ============================================================================
// TRACK VIEW — fire & forget, anonyme OK
// ============================================================================
export async function trackPropertyView(propertyId: string): Promise<void> {
  const user = await getCurrentUser();
  const admin = createAdminClient();

  // Ne pas tracker les vues du proprio sur sa propre annonce
  if (user) {
    const { data: p } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", propertyId)
      .single();
    if (p?.owner_id === user.id) return;
  }

  await admin.from("property_views").insert({
    property_id: propertyId,
    viewer_id: user?.id ?? null,
  });

  // Incrémenter le compteur dénormalisé
  await admin.rpc("increment_property_view", { p_id: propertyId }).then(
    () => {},
    async () => {
      // Si la fonction RPC n'existe pas, fallback en lecture+écriture
      const { data: cur } = await admin
        .from("properties")
        .select("view_count")
        .eq("id", propertyId)
        .single();
      if (cur) {
        await admin
          .from("properties")
          .update({ view_count: cur.view_count + 1 })
          .eq("id", propertyId);
      }
    },
  );
}

// ============================================================================
// SEED — création d'annonces test pour le dev
// Accessible uniquement aux propriétaires connectés (pour leur compte)
// ============================================================================
const SEED_PROPERTIES = [
  {
    title: "Appartement T3 lumineux à Ivandry",
    description:
      "Magnifique appartement traversant avec deux balcons. Cuisine équipée, salon spacieux, deux chambres + bureau. Quartier calme et sécurisé.",
    property_type: "appartement" as const,
    listing_type: "rent" as const,
    price: 1800000,
    surface: 85,
    rooms: 3,
    address: "Lot II A 23 Ivandry",
    city: "Antananarivo",
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
    ],
    is_premium: true,
    is_verified: true,
  },
  {
    title: "Villa moderne avec piscine à Ambohibao",
    description:
      "Villa contemporaine de standing avec piscine, grand jardin paysager, 5 chambres dont 2 suites parentales. Garage 2 voitures, climatisation centralisée.",
    property_type: "maison" as const,
    listing_type: "sale" as const,
    price: 850000000,
    surface: 250,
    rooms: 5,
    address: "Rue des Acacias, Ambohibao",
    city: "Antananarivo",
    photos: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
    ],
    is_premium: false,
    is_verified: true,
  },
  {
    title: "Studio meublé proche du centre-ville",
    description:
      "Studio fonctionnel et bien équipé, idéal pour étudiant ou jeune actif. Kitchenette, salle de bain rénovée, mezzanine.",
    property_type: "appartement" as const,
    listing_type: "rent" as const,
    price: 600000,
    surface: 32,
    rooms: 1,
    address: "Rue du Bord de Mer",
    city: "Tamatave",
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
    ],
    is_premium: false,
    is_verified: false,
  },
  {
    title: "Maison familiale rénovée à Andoharanofotsy",
    description:
      "Maison de plain-pied entièrement rénovée. 4 chambres, double séjour, cuisine américaine, jardin clôturé de 300m².",
    property_type: "maison" as const,
    listing_type: "sale" as const,
    price: 320000000,
    surface: 180,
    rooms: 4,
    address: "Andoharanofotsy",
    city: "Antananarivo",
    photos: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80",
    ],
    is_premium: true,
    is_verified: true,
  },
  {
    title: "Local commercial 60m² zone Analakely",
    description:
      "Idéalement situé en plein centre Analakely. Vitrine sur rue passante, arrière-boutique, sanitaires. Fort potentiel commercial.",
    property_type: "local_commercial" as const,
    listing_type: "rent" as const,
    price: 2500000,
    surface: 60,
    rooms: null,
    address: "Avenue de l'Indépendance, Analakely",
    city: "Antananarivo",
    photos: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80",
    ],
    is_premium: false,
    is_verified: true,
  },
  {
    title: "Terrain titré 500m² vue mer à Mahajanga",
    description:
      "Magnifique terrain plat de 500m² avec titre foncier, vue dégagée sur la mer. Tout-à-l'égout disponible, eau et électricité à proximité.",
    property_type: "terrain" as const,
    listing_type: "sale" as const,
    price: 95000000,
    surface: 500,
    rooms: null,
    address: "Quartier résidentiel, Mahajanga",
    city: "Mahajanga",
    photos: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80",
    ],
    is_premium: false,
    is_verified: true,
  },
  {
    title: "Maison de charme avec jardin tropical",
    description:
      "Belle maison de caractère, ancienne mais bien entretenue. Jardin tropical avec manguiers et cocotiers. 4 chambres, salon avec cheminée.",
    property_type: "maison" as const,
    listing_type: "sale" as const,
    price: 180000000,
    surface: 140,
    rooms: 4,
    address: "Quartier Cap-Diego",
    city: "Diego-Suarez",
    photos: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
    ],
    is_premium: true,
    is_verified: true,
  },
  {
    title: "Appartement T2 calme à Antsirabe",
    description:
      "T2 au 2ème étage, calme et lumineux. Quartier résidentiel proche du centre. Idéal couple ou étudiant.",
    property_type: "appartement" as const,
    listing_type: "rent" as const,
    price: 750000,
    surface: 55,
    rooms: 2,
    address: "Rue Ravoahangy",
    city: "Antsirabe",
    photos: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
    ],
    is_premium: false,
    is_verified: false,
  },
];

export async function seedTestPropertiesAction(): Promise<
  { ok: true; created: number } | { ok: false; error: string }
> {
  const user = await requireUser();

  // Seul un admin peut créer des annonces de démo (sécurité production)
  if (!user.roles.includes("admin")) {
    return {
      ok: false,
      error: "Cette fonctionnalité est réservée aux administrateurs.",
    };
  }

  const admin = createAdminClient();

  // Vérifier qu'on n'a pas déjà seedé
  const { count } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (count && count >= 5) {
    return {
      ok: false,
      error: `Vous avez déjà ${count} annonces. Le seed ne s'exécute qu'une fois.`,
    };
  }

  let created = 0;
  for (const seed of SEED_PROPERTIES) {
    const { data: prop, error } = await admin
      .from("properties")
      .insert({
        owner_id: user.id,
        title: seed.title,
        description: seed.description,
        property_type: seed.property_type,
        listing_type: seed.listing_type,
        price: seed.price,
        surface: seed.surface,
        rooms: seed.rooms,
        address: seed.address,
        city: seed.city,
        is_premium: seed.is_premium,
        is_verified: seed.is_verified,
        status: "active",
      })
      .select("id")
      .single();

    if (error || !prop) {
      console.error("[seed] property insert failed", error);
      continue;
    }

    const photoRows = seed.photos.map((url, idx) => ({
      property_id: prop.id,
      url,
      display_order: idx,
    }));

    await admin.from("property_photos").insert(photoRows);
    created++;
  }

  revalidatePath("/", "layout");
  return { ok: true, created };
}

// ============================================================================
// FREE UNLOCKS — combien il reste à l'utilisateur dans les dernières 24h
// ============================================================================
export async function getFreeUnlocksRemaining(): Promise<{
  enabled: boolean;
  remaining: number;
  total: number;
}> {
  const user = await getCurrentUser();
  if (!user) return { enabled: false, remaining: 0, total: 0 };

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("site_settings")
    .select("free_unlocks_per_day, free_mode_until")
    .eq("id", 1)
    .single();

  const isFreeMode = settings?.free_mode_until
    ? new Date(settings.free_mode_until).getTime() > Date.now()
    : false;
  if (isFreeMode) return { enabled: false, remaining: 0, total: 0 };

  const total = settings?.free_unlocks_per_day ?? 0;
  if (total <= 0) return { enabled: false, remaining: 0, total: 0 };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("unlock_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("unlocked_at", since);

  return {
    enabled: true,
    remaining: Math.max(0, total - (count ?? 0)),
    total,
  };
}
