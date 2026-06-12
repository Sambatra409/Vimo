import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyCard } from "@/components/property-card";
import type { PropertyListItem } from "@/lib/types";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/favorites");

  const admin = createAdminClient();
  const { data } = await admin
    .from("favorites")
    .select(
      "property_id, created_at, properties!inner(id, title, city, surface, price, rooms, property_type, listing_type, is_premium, is_verified, status, property_photos(url, display_order))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items: PropertyListItem[] = (data ?? [])
    .map((row: any) => row.properties)
    .filter((p: any) => p?.status === "active")
    .map((p: any) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Espace locataire
        </p>
        <h1 className="font-display text-3xl md:text-5xl italic">
          Mes favoris
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          {items.length === 0
            ? "Vous n'avez encore sauvegardé aucune annonce."
            : `${items.length} bien${items.length > 1 ? "s" : ""} sauvegardé${items.length > 1 ? "s" : ""}.`}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card max-w-2xl mx-auto">
          <Heart className="size-10 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            Parcourez les annonces et cliquez sur le cœur pour les sauvegarder ici.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90"
          >
            Découvrir les annonces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((p, i) => (
            <PropertyCard key={p.id} p={p} delay={(i % 6) * 60} />
          ))}
        </div>
      )}
    </div>
  );
}
