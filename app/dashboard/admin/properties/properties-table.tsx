"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ExternalLink, BadgeCheck, BadgeMinus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeletePropertyAction,
  adminToggleVerifiedAction,
} from "@/lib/actions/admin";
import { formatAr, titleCase, propertyTypeLabel } from "@/lib/format";

interface Item {
  id: string;
  title: string;
  city: string;
  price: number;
  property_type: string;
  listing_type: string;
  status: string;
  is_premium: boolean;
  is_verified: boolean;
  view_count: number;
  created_at: string;
  profiles?: { full_name: string; email: string };
}

export function PropertiesAdminTable({
  initialItems,
  initialSearch,
}: {
  initialItems: Item[];
  initialSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [pending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`${pathname}?q=${encodeURIComponent(search)}`);
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Supprimer définitivement "${title}" ?`)) return;
    startTransition(async () => {
      await adminDeletePropertyAction(id);
      toast.success("Annonce supprimée");
      router.refresh();
    });
  };

  const handleToggleVerified = (id: string, verified: boolean) => {
    startTransition(async () => {
      await adminToggleVerifiedAction(id, verified);
      toast.success(verified ? "Badge ✓ accordé" : "Badge ✓ retiré");
      router.refresh();
    });
  };

  return (
    <>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre…"
            className="w-full min-h-12 pl-10 pr-4 bg-background border border-border rounded-lg text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 min-h-12 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
        >
          Chercher
        </button>
      </form>

      {initialItems.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-2xl">
          Aucune annonce.
        </p>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {initialItems.map((p) => (
            <article key={p.id} className="p-3 md:p-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <p className="font-semibold text-sm truncate">
                      {titleCase(p.title)}
                    </p>
                    <StatusPill status={p.status} />
                    {p.is_verified && (
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-verified/15 text-verified px-1.5 py-0.5 rounded">
                        ✓
                      </span>
                    )}
                    {p.is_premium && (
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-premium/30 text-premium-foreground px-1.5 py-0.5 rounded">
                        ⭐
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {propertyTypeLabel(p.property_type)} ·{" "}
                    {titleCase(p.city)} ·{" "}
                    <span className="font-mono">{formatAr(p.price)}</span> · {p.view_count} vues
                  </p>
                  {p.profiles && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Par {p.profiles.full_name} ({p.profiles.email})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <Link
                  href={`/property/${p.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-muted hover:bg-card"
                >
                  <ExternalLink className="size-3" /> Voir
                </Link>
                {p.is_verified ? (
                  <button
                    onClick={() => handleToggleVerified(p.id, false)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-muted hover:bg-card text-muted-foreground"
                  >
                    <BadgeMinus className="size-3" /> Retirer ✓
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleVerified(p.id, true)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-verified/10 text-verified hover:bg-verified/20"
                  >
                    <BadgeCheck className="size-3" /> Vérifier
                  </button>
                )}
                <button
                  onClick={() => handleDelete(p.id, p.title)}
                  disabled={pending}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="size-3" /> Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-verified/15 text-verified" },
    draft: { label: "Brouillon", cls: "bg-muted text-muted-foreground" },
    paused: { label: "Pausée", cls: "bg-premium/20 text-premium-foreground" },
    archived: { label: "Archivée", cls: "bg-destructive/15 text-destructive" },
  };
  const info = map[status] ?? map.draft;
  return (
    <span className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${info.cls}`}>
      {info.label}
    </span>
  );
}
