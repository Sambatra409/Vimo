import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Sparkles, ImageOff } from "lucide-react";
import { formatAr, propertyTypeLabel, titleCase } from "@/lib/format";
import type { PropertyListItem } from "@/lib/types";

interface Props {
  p: PropertyListItem;
  delay?: number;
  priority?: boolean;
}

export function PropertyCard({ p, delay = 0, priority = false }: Props) {
  const isSale = p.listing_type === "sale";
  const title = titleCase(p.title);
  const city = titleCase(p.city);

  return (
    <Link
      href={`/property/${p.id}`}
      className="group cursor-pointer animate-fade-up block"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl mb-4 bg-muted ${
          p.is_premium
            ? "ring-2 ring-premium/60 ring-offset-2 ring-offset-background"
            : ""
        }`}
      >
        {p.cover_url ? (
          <Image
            src={p.cover_url}
            alt={title}
            width={600}
            height={450}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
            <ImageOff className="size-7 opacity-60" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">
              {propertyTypeLabel(p.property_type)}
            </span>
          </div>
        )}

        {p.is_premium && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-premium text-premium-foreground shadow-md ring-1 ring-black/5 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="size-3" />
            Premium
          </span>
        )}

        {p.is_verified && (
          <span
            title="Annonce vérifiée"
            aria-label="Annonce vérifiée"
            className="absolute top-3 right-3 size-8 grid place-items-center rounded-full bg-verified text-verified-foreground shadow-md ring-1 ring-black/5"
          >
            <BadgeCheck className="size-4" />
          </span>
        )}
      </div>

      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className="font-semibold text-base md:text-lg leading-tight truncate"
            title={title}
          >
            {title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground truncate mt-1">
            {p.rooms ? `${p.rooms} pièces · ` : ""}
            {p.surface} m² · {city}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono font-semibold text-primary whitespace-nowrap leading-tight">
            {formatAr(p.price)}
          </p>
          <p className="text-[10px] text-muted-foreground font-sans mt-1 uppercase tracking-wider">
            {isSale ? "Prix d'achat" : "/ mois"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="block animate-pulse">
      <div className="w-full aspect-[4/3] rounded-2xl bg-muted mb-4" />
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="text-right shrink-0">
          <div className="h-4 bg-muted rounded w-20 mb-2" />
          <div className="h-2.5 bg-muted rounded w-12 ml-auto" />
        </div>
      </div>
    </div>
  );
}
