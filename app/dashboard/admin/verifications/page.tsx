import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { ApproveRejectButtons } from "./approve-reject-buttons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVerificationsPage() {
  await requireRole("admin");
  const admin = createAdminClient();

  // === Récupération brute ===
  const { data: requests, error: reqErr } = await admin
    .from("verification_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (reqErr) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-2xl p-5">
        <h2 className="font-bold text-destructive mb-2">Erreur DB</h2>
        <pre className="text-xs">{JSON.stringify(reqErr, null, 2)}</pre>
      </div>
    );
  }

  const rows = requests ?? [];

  // === Enrichissement ===
  let enriched: any[] = [];
  if (rows.length > 0) {
    const propIds = Array.from(new Set(rows.map((r: any) => r.property_id)));
    const ownerIds = Array.from(new Set(rows.map((r: any) => r.owner_id)));

    const [propsRes, profsRes, photosRes] = await Promise.all([
      admin.from("properties").select("id, title, city, price").in("id", propIds),
      admin.from("profiles").select("id, full_name, email, phone").in("id", ownerIds),
      admin.from("property_photos").select("property_id, url, display_order").in("property_id", propIds),
    ]);

    const propMap = new Map((propsRes.data ?? []).map((p: any) => [p.id, p]));
    const profMap = new Map((profsRes.data ?? []).map((p: any) => [p.id, p]));
    const photosByProp = new Map<string, string>();
    for (const ph of photosRes.data ?? []) {
      if (!photosByProp.has(ph.property_id)) photosByProp.set(ph.property_id, ph.url);
    }

    enriched = rows.map((r: any) => ({
      ...r,
      property: propMap.get(r.property_id) ?? null,
      profile: profMap.get(r.owner_id) ?? null,
      cover: photosByProp.get(r.property_id) ?? null,
    }));
  }

  const pending = enriched.filter((r: any) => r.status === "pending");

  return (
    <>
      <h2 className="font-display text-2xl italic mb-1">Vérifications d'annonces</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {pending.length} demande{pending.length > 1 ? "s" : ""} en attente — {enriched.length} au total
      </p>

      {enriched.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm">Aucune demande de vérification.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enriched.map((r) => (
            <article
              key={r.id}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {r.cover ? (
                  <div className="relative w-full md:w-48 aspect-video md:aspect-auto bg-muted shrink-0">
                    <Image src={r.cover} alt="" fill sizes="192px" className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full md:w-48 aspect-video md:aspect-auto bg-muted grid place-items-center text-muted-foreground text-xs">
                    Pas de photo
                  </div>
                )}

                <div className="flex-1 p-4">
                  <div className="flex items-start gap-2 flex-wrap mb-2">
                    <StatusPill status={r.status} />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/property/${r.property_id}`}
                        target="_blank"
                        className="font-semibold text-sm hover:text-primary"
                      >
                        {r.property?.title ?? "(annonce supprimée)"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {r.property?.city} · {new Intl.NumberFormat("fr-FR").format(r.property?.price ?? 0)} Ar
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground shrink-0">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  {r.profile && (
                    <div className="bg-muted/50 border border-border rounded-lg p-2 mb-2 text-xs">
                      <p className="font-semibold">{r.profile.full_name}</p>
                      <p className="text-muted-foreground">
                        {r.profile.phone && <span className="font-mono">{r.profile.phone}</span>}
                        {r.profile.phone && r.profile.email && " · "}
                        {r.profile.email}
                      </p>
                    </div>
                  )}

                  {r.owner_note && (
                    <p className="text-xs text-foreground/80 italic mb-2">
                      "{r.owner_note}"
                    </p>
                  )}

                  {r.tokens_used > 0 && (
                    <p className="text-[11px] text-muted-foreground mb-2">
                      {r.tokens_used} jetons utilisés
                    </p>
                  )}

                  {r.admin_note && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 mb-2 text-xs">
                      <span className="font-semibold">Note admin :</span> {r.admin_note}
                    </div>
                  )}

                  {r.status === "pending" && (
                    <ApproveRejectButtons
                      requestId={r.id}
                      propertyTitle={r.property?.title ?? "cette annonce"}
                      hadTokens={r.tokens_used > 0}
                    />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: any = {
    pending: { label: "EN ATTENTE", cls: "bg-premium/30 text-premium-foreground" },
    approved: { label: "VALIDÉE", cls: "bg-verified/20 text-verified" },
    rejected: { label: "REFUSÉE", cls: "bg-destructive/20 text-destructive" },
  };
  const info = map[status] ?? map.pending;
  return (
    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${info.cls} shrink-0`}>
      {info.label}
    </span>
  );
}
