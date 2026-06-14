import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Eye, Pencil, BarChart3 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatAr, titleCase, propertyTypeLabel } from "@/lib/format";
import { SeedButton } from "./seed-button";

export default async function OwnerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/owner");

  // Récupérer les annonces du propriétaire
  const admin = createAdminClient();
  const { data: properties } = await admin
    .from("properties")
    .select(
      "id, title, city, price, listing_type, property_type, status, view_count, is_premium, is_verified, property_photos(url, display_order)",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const list = properties ?? [];
  const activeCount = list.filter((p) => p.status === "active").length;
  const isAdmin = user.roles.includes("admin");

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Hero du dashboard */}
      <header className="mb-8 md:mb-10">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Espace propriétaire
        </p>
        <h1 className="font-display text-3xl md:text-5xl italic">
          Bonjour, {titleCase(user.full_name.split(" ")[0])}.
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          {list.length === 0
            ? "Vous n'avez pas encore d'annonce. Commencez par en créer une."
            : `${activeCount} annonce${activeCount > 1 ? "s" : ""} active${activeCount > 1 ? "s" : ""} sur ${list.length} au total.`}
        </p>
      </header>

      {/* Actions principales */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/property/new"
          className="inline-flex items-center gap-2 px-5 min-h-12 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" />
          Nouvelle annonce
        </Link>
        {/* Bouton seed réservé aux admins uniquement */}
        {isAdmin && list.length === 0 && <SeedButton />}
      </div>

      {/* Liste des annonces */}
      {list.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card max-w-2xl mx-auto">
          <p className="text-muted-foreground mb-4">
            Pas encore d'annonce. Cliquez sur "Nouvelle annonce" pour commencer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((p: any) => {
            const cover = (p.property_photos ?? []).sort(
              (a: any, b: any) => a.display_order - b.display_order,
            )[0];
            return (
              <article
                key={p.id}
                className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row gap-4"
              >
                <div className="relative aspect-video sm:aspect-auto sm:w-40 shrink-0 bg-muted">
                  {cover && (
                    <img
                      src={cover.url}
                      alt={p.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4 sm:py-4 sm:pl-0 sm:pr-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm md:text-base leading-tight truncate">
                      {titleCase(p.title)}
                    </h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {propertyTypeLabel(p.property_type)} · {titleCase(p.city)}
                  </p>
                  <p className="font-mono text-sm font-semibold text-primary mb-3">
                    {formatAr(p.price)}
                    {p.listing_type === "rent" && (
                      <span className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider ml-1">
                        / mois
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2 text-xs">
                    <Link
                      href={`/property/${p.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-muted text-foreground"
                    >
                      <Eye className="size-3" /> Voir
                    </Link>
                    <Link
                      href={`/property/${p.id}/edit`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-muted text-foreground"
                    >
                      <Pencil className="size-3" /> Modifier
                    </Link>
                    <Link
                      href={`/property/${p.id}/stats`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-muted text-foreground"
                    >
                      <BarChart3 className="size-3" /> Stats
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-verified/15 text-verified" },
    draft: { label: "Brouillon", cls: "bg-muted text-muted-foreground" },
    paused: { label: "Pausée", cls: "bg-premium/20 text-premium-foreground" },
    archived: { label: "Archivée", cls: "bg-destructive/15 text-destructive" },
  };
  const info = map[status] ?? map.draft;
  return (
    <span
      className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${info.cls}`}
    >
      {info.label}
    </span>
  );
}
