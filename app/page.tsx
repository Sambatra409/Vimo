import { Suspense } from "react";
import { SearchFilters } from "@/components/search-filters";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property-card";
import { searchProperties } from "@/lib/actions/properties";
import type { PropertyType, ListingType } from "@/lib/types";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;

  // Parse les searchParams en filtres typés
  const filters = {
    city: typeof params.city === "string" ? params.city : "",
    type: typeof params.type === "string" ? (params.type as PropertyType | "") : "",
    listing:
      typeof params.listing === "string" ? (params.listing as ListingType | "") : "",
    q: typeof params.q === "string" ? params.q : "",
    pmin: params.pmin ? Number(String(params.pmin).replace(/\s/g, "")) || 0 : 0,
    pmax: params.pmax ? Number(String(params.pmax).replace(/\s/g, "")) || 0 : 0,
    smin: params.smin ? Number(params.smin) || 0 : 0,
    rooms: params.rooms ? Number(params.rooms) || 0 : 0,
  };

  return (
    <>
      {/* Hero éditorial */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-16 pb-8 md:pb-12 text-center animate-fade-up">
        <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl mb-4 md:mb-6 text-balance leading-[1.1]">
          Trouvez votre <span className="italic">foyer</span> au cœur de Madagascar
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-lg mb-8 md:mb-12 text-pretty px-2">
          La première plateforme immobilière locale avec vérification sur site.
        </p>

        {/* Filtres client-side (URL state) */}
        <Suspense fallback={<div className="h-32" />}>
          <SearchFilters />
        </Suspense>
      </section>

      {/* Grille des annonces */}
      <Suspense fallback={<ResultsSkeleton />}>
        <PropertiesResults filters={filters} />
      </Suspense>
    </>
  );
}

async function PropertiesResults({ filters }: { filters: any }) {
  const { items } = await searchProperties(filters);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 md:pb-24">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-display font-bold italic">
          Annonces récentes
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-2">
          {items.length === 0
            ? "Aucune annonce ne correspond à vos critères."
            : `${items.length} bien${items.length > 1 ? "s" : ""} disponible${items.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl bg-card max-w-2xl mx-auto">
          <p className="mb-2">Pas de résultat avec ces filtres.</p>
          <p className="text-xs">Essayez d'élargir votre recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((p, i) => (
            <PropertyCard
              key={p.id}
              p={p}
              delay={(i % 6) * 60}
              priority={i < 3}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ResultsSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 md:pb-24">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-display font-bold italic">
          Annonces récentes
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-2">
          Chargement…
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
