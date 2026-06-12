"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PropertyListItem } from "@/lib/types";

/**
 * Récupère plusieurs annonces pour le comparateur.
 * Lecture publique, mais on filtre les annonces actives uniquement.
 */
export async function getPropertiesByIds(
  ids: string[],
): Promise<(PropertyListItem & { property_type: any; address?: string })[]> {
  if (!ids || ids.length === 0) return [];
  if (ids.length > 5) ids = ids.slice(0, 5); // garde-fou anti-abus

  const admin = createAdminClient();
  const { data } = await admin
    .from("properties")
    .select(
      "id, title, city, surface, price, rooms, property_type, listing_type, is_premium, is_verified, address, property_photos(url, display_order)",
    )
    .in("id", ids)
    .eq("status", "active");

  if (!data) return [];

  return data.map((p: any) => {
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
      address: p.address,
    };
  });
}
