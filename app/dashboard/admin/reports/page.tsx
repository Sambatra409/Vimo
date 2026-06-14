import Link from "next/link";
import { listReportsAdmin } from "@/lib/actions/reports";
import { ReportActions } from "./report-actions";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await listReportsAdmin();
  const pending = reports.filter((r: any) => r.status === "pending");

  return (
    <>
      <h2 className="font-display text-2xl italic mb-1">Signalements d'annonces</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {pending.length} signalement{pending.length > 1 ? "s" : ""} en attente — {reports.length} au total
      </p>

      {reports.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm">Aucun signalement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <article
              key={r.id}
              className={`bg-card border rounded-2xl p-4 ${
                r.status === "pending" ? "border-destructive/30" : "border-border"
              }`}
            >
              <div className="flex flex-wrap items-start gap-2 mb-3">
                <StatusPill status={r.status} />
                <span className="text-[10px] uppercase tracking-widest font-bold bg-muted text-muted-foreground px-2 py-1 rounded">
                  {r.category_label}
                </span>
                <p className="text-[11px] text-muted-foreground ml-auto">
                  {new Date(r.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="mb-3">
                {r.property ? (
                  <Link
                    href={`/property/${r.property_id}`}
                    target="_blank"
                    className="font-semibold text-sm hover:text-primary"
                  >
                    {r.property.title} — {r.property.city}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Annonce supprimée
                  </p>
                )}
                {r.reporter && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Signalé par <strong>{r.reporter.full_name}</strong> ({r.reporter.email})
                  </p>
                )}
              </div>

              {r.message && (
                <div className="bg-muted/50 border-l-2 border-primary/40 px-3 py-2 mb-3 text-xs italic">
                  "{r.message}"
                </div>
              )}

              {r.admin_note && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 mb-3 text-xs">
                  <span className="font-semibold">Note admin :</span> {r.admin_note}
                </div>
              )}

              {r.status === "pending" && r.property && (
                <ReportActions
                  reportId={r.id}
                  propertyTitle={r.property.title}
                />
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: any = {
    pending: { label: "EN ATTENTE", cls: "bg-destructive/20 text-destructive" },
    reviewed: { label: "TRAITÉ", cls: "bg-verified/20 text-verified" },
    dismissed: { label: "REJETÉ", cls: "bg-muted text-muted-foreground" },
  };
  const info = map[status] ?? map.pending;
  return (
    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${info.cls}`}>
      {info.label}
    </span>
  );
}
