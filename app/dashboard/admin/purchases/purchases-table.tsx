"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { approvePurchaseAction, rejectPurchaseAction } from "@/lib/actions/admin";
import { formatAr } from "@/lib/format";

interface Purchase {
  id: string;
  user_id: string;
  pack_size: number;
  amount_ar: number;
  payment_reference: string;
  payment_method: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  validated_at: string | null;
  created_at: string;
  profiles?: { full_name: string; email: string };
}

export function PurchasesTable({
  initialPurchases,
}: {
  initialPurchases: Purchase[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [pending, startTransition] = useTransition();

  const filtered = initialPurchases.filter((p) => filter === "all" || p.status === filter);

  const handleApprove = (id: string, packSize: number, userName: string) => {
    if (!confirm(`Valider l'achat de ${packSize} jetons pour ${userName} ?`)) return;
    const note = prompt("Note (optionnelle) :") ?? "";
    startTransition(async () => {
      const res = await approvePurchaseAction(id, note);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(`+${packSize} jetons crédités`);
        router.refresh();
      }
    });
  };

  const handleReject = (id: string) => {
    const note = prompt("Motif du refus (visible par l'utilisateur) :");
    if (!note) {
      toast.error("Le motif est obligatoire.");
      return;
    }
    startTransition(async () => {
      const res = await rejectPurchaseAction(id, note);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Achat refusé");
        router.refresh();
      }
    });
  };

  return (
    <>
      {/* Filtres */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs uppercase tracking-widest font-bold rounded-full whitespace-nowrap ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border hover:bg-muted"
            }`}
          >
            {f === "pending"
              ? "En attente"
              : f === "approved"
                ? "Validés"
                : f === "rejected"
                  ? "Refusés"
                  : "Tous"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm">
            {filter === "pending"
              ? "🎉 Aucune demande en attente"
              : "Aucun achat dans cette catégorie."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {filtered.map((p) => (
            <PurchaseRow
              key={p.id}
              p={p}
              onApprove={handleApprove}
              onReject={handleReject}
              pending={pending}
            />
          ))}
        </div>
      )}
    </>
  );
}

function PurchaseRow({
  p,
  onApprove,
  onReject,
  pending,
}: {
  p: Purchase;
  onApprove: (id: string, size: number, name: string) => void;
  onReject: (id: string) => void;
  pending: boolean;
}) {
  const date = new Date(p.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <StatusBadge status={p.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-sm">
              {p.pack_size} jetons —{" "}
              <span className="font-mono">{formatAr(p.amount_ar)}</span>
            </p>
            <span className="text-[10px] uppercase tracking-widest font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {p.payment_method.replace("_", " ")}
            </span>
          </div>
          {p.profiles && (
            <p className="text-xs text-muted-foreground truncate">
              {p.profiles.full_name} · {p.profiles.email}
            </p>
          )}
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Réf: {p.payment_reference}
          </p>
          {p.admin_note && (
            <p className="text-xs text-foreground/80 mt-1.5 italic">
              Note: {p.admin_note}
            </p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground shrink-0">{date}</p>
      </div>

      {p.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() =>
              onApprove(p.id, p.pack_size, p.profiles?.full_name ?? "utilisateur")
            }
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-verified text-verified-foreground hover:opacity-90"
          >
            <Check className="size-3.5" /> Valider et créditer
          </button>
          <button
            onClick={() => onReject(p.id)}
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            <X className="size-3.5" /> Refuser
          </button>
        </div>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="size-8 grid place-items-center rounded-full bg-verified/20 text-verified shrink-0">
        <Check className="size-4" />
      </span>
    );
  if (status === "rejected")
    return (
      <span className="size-8 grid place-items-center rounded-full bg-destructive/20 text-destructive shrink-0">
        <X className="size-4" />
      </span>
    );
  return (
    <span className="size-8 grid place-items-center rounded-full bg-premium/30 text-premium-foreground shrink-0">
      <Clock className="size-4" />
    </span>
  );
}
