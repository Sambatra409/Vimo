"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GitCompare, X } from "lucide-react";
import { getPropertiesByIds } from "@/lib/actions/compare";
import { formatAr, titleCase, propertyTypeLabel, listingTypeLabel } from "@/lib/format";

const STORAGE_KEY = "vohitra-compare";

export function ComparePageClient() {
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setIds(Array.isArray(parsed) ? parsed.slice(0, 3) : []);
    } catch {
      setIds([]);
    }
  }, []);

  // Fetch les données quand les IDs changent
  useEffect(() => {
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getPropertiesByIds(ids).then((res) => {
      setItems(res);
      setLoading(false);
    });
  }, [ids]);

  const removeFromCompare = (id: string) => {
    const next = ids.filter((x) => x !== id);
    setIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearAll = () => {
    setIds([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  };

  return (
    <>
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Outil de décision
        </p>
        <h1 className="font-display text-3xl md:text-5xl italic mb-2">
          Comparateur
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {ids.length === 0
            ? "Ajoutez jusqu'à 3 annonces depuis la page d'accueil pour les comparer."
            : `${items.length} bien${items.length > 1 ? "s" : ""} en comparaison.`}
        </p>
      </header>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Chargement…</p>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive mb-4"
          >
            Vider le comparateur
          </button>

          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 text-[10px] uppercase tracking-widest font-bold text-muted-foreground w-32" />
                  {items.map((p) => (
                    <th key={p.id} className="p-3 text-left align-top">
                      <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="relative aspect-video bg-muted">
                          {p.cover_url ? (
                            <Image
                              src={p.cover_url}
                              alt={p.title}
                              fill
                              sizes="240px"
                              className="object-cover"
                            />
                          ) : null}
                          <button
                            onClick={() => removeFromCompare(p.id)}
                            aria-label="Retirer"
                            className="absolute top-2 right-2 size-7 grid place-items-center bg-black/60 hover:bg-destructive text-white rounded-full"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {titleCase(p.title)}
                          </h3>
                          <Link
                            href={`/property/${p.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Voir l'annonce →
                          </Link>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                <Row label="Type" cells={items.map((p) => propertyTypeLabel(p.property_type))} />
                <Row label="Transaction" cells={items.map((p) => listingTypeLabel(p.listing_type))} />
                <Row
                  label="Prix"
                  cells={items.map((p) => formatAr(p.price))}
                  mono
                  highlight
                />
                <Row label="Surface" cells={items.map((p) => `${p.surface} m²`)} />
                <Row label="Pièces" cells={items.map((p) => (p.rooms ? String(p.rooms) : "—"))} />
                <Row
                  label="Prix / m²"
                  cells={items.map((p) => formatAr(Math.round(p.price / p.surface)))}
                  mono
                />
                <Row label="Ville" cells={items.map((p) => titleCase(p.city))} />
                <Row
                  label="Premium"
                  cells={items.map((p) => (p.is_premium ? "⭐ Oui" : "—"))}
                />
                <Row
                  label="Vérifié"
                  cells={items.map((p) => (p.is_verified ? "✓ Oui" : "—"))}
                />
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function Row({
  label,
  cells,
  mono = false,
  highlight = false,
}: {
  label: string;
  cells: string[];
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr className="border-t border-border">
      <td className="p-3 text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
        {label}
      </td>
      {cells.map((c, i) => (
        <td
          key={i}
          className={`p-3 ${mono ? "font-mono" : ""} ${highlight ? "text-primary font-semibold" : ""}`}
        >
          {c}
        </td>
      ))}
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card max-w-2xl mx-auto">
      <GitCompare className="size-12 mx-auto text-muted-foreground/40 mb-4" />
      <h2 className="font-display text-xl italic mb-2">
        Comparateur vide
      </h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto px-4">
        Sur une annonce, cliquez sur "Ajouter au comparateur" pour la sauvegarder ici.
        Jusqu'à 3 biens en simultané.
      </p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90"
      >
        Découvrir les annonces
      </Link>
    </div>
  );
}
