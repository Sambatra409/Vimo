"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  X,
  Clock,
  ExternalLink,
  Phone,
  Mail,
  BadgeCheck,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  approveVerificationAction,
  rejectVerificationAction,
} from "@/lib/actions/verification";
import { titleCase, propertyTypeLabel, formatAr } from "@/lib/format";

interface Req {
  id: string;
  property_id: string;
  owner_id: string;
  status: "pending" | "approved" | "rejected";
  tokens_used: number;
  owner_note: string | null;
  admin_note: string | null;
  validated_at: string | null;
  created_at: string;
  properties?: {
    id: string;
    title: string;
    city: string;
    property_type: string;
    listing_type: string;
    price: number;
    property_photos?: { url: string; display_order: number }[];
  };
  profiles?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export function VerificationsTable({
  initialRequests,
}: {
  initialRequests: Req[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [pending, startTransition] = useTransition();

  const filtered = initialRequests.filter(
    (r) => filter === "all" || r.status === filter,
  );

  const handleApprove = (id: string, propertyTitle: string) => {
    if (!confirm(`Valider la vérification de "${propertyTitle}" ?\n\nL'annonce recevra le badge ✓ vert.`)) return;
    const note = prompt("Note (optionnelle, visible par le propriétaire) :") ?? "";
    startTransition(async () => {
      const res = await approveVerificationAction(id, note);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Vérification approuvée ✓");
        router.refresh();
      }
    });
  };

  const handleReject = (id: string, hadTokens: boolean) => {
    const note = prompt(
      "Motif du refus (visible par le propriétaire) :",
    );
    if (!note) {
      toast.error("Motif obligatoire.");
      return;
    }
    let refund = true;
    if (hadTokens) {
      refund = confirm(
        "Rembourser les jetons utilisés ?\n\nOK = Rembourser\nAnnuler = Ne pas rembourser (cas de fraude)",
      );
    }
    startTransition(async () => {
      const res = await rejectVerificationAction(id, note, refund);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(refund ? "Refusée et remboursée" : "Refusée sans remboursement");
        router.refresh();
      }
    });
  };

  return (
    <>
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
                ? "Validées"
                : f === "rejected"
                  ? "Refusées"
                  : "Toutes"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm">
            {filter === "pending"
              ? "🎉 Aucune demande en attente"
              : "Aucune demande dans cette catégorie."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <RequestCard
              key={r.id}
              r={r}
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

function RequestCard({
  r,
  onApprove,
  onReject,
  pending,
}: {
  r: Req;
  onApprove: (id: string, title: string) => void;
  onReject: (id: string, hadTokens: boolean) => void;
  pending: boolean;
}) {
  const cover = (r.properties?.property_photos ?? []).sort(
    (a: any, b: any) => a.display_order - b.display_order,
  )[0];
  const date = new Date(r.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Photo */}
        <div className="relative aspect-video md:aspect-auto md:w-48 shrink-0 bg-muted">
          {cover ? (
            <Image
              src={cover.url}
              alt={r.properties?.title ?? ""}
              fill
              sizes="192px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 p-4">
          <div className="flex items-start gap-2 flex-wrap mb-3">
            <StatusBadge status={r.status} />
            <div className="min-w-0 flex-1">
              <Link
                href={`/property/${r.property_id}`}
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold text-sm hover:text-primary"
              >
                {titleCase(r.properties?.title ?? "Annonce")}
                <ExternalLink className="size-3" />
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                {propertyTypeLabel(r.properties?.property_type ?? "")} ·{" "}
                {titleCase(r.properties?.city ?? "")} ·{" "}
                <span className="font-mono">{formatAr(r.properties?.price ?? 0)}</span>
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground shrink-0">{date}</p>
          </div>

          {/* Contact du propriétaire */}
          {r.profiles && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 mb-3 text-xs space-y-1">
              <p className="font-semibold">{titleCase(r.profiles.full_name)}</p>
              <div className="flex flex-wrap gap-3 text-muted-foreground">
                {r.profiles.phone && (
                  <a
                    href={`tel:${r.profiles.phone}`}
                    className="inline-flex items-center gap-1 hover:text-primary font-mono"
                  >
                    <Phone className="size-3" />
                    {r.profiles.phone}
                  </a>
                )}
                <a
                  href={`mailto:${r.profiles.email}`}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  <Mail className="size-3" />
                  {r.profiles.email}
                </a>
              </div>
            </div>
          )}

          {/* Note du proprio */}
          {r.owner_note && (
            <div className="bg-background border border-border rounded-lg p-3 mb-3 text-xs">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
                Message du propriétaire
              </p>
              <p className="text-foreground/90 leading-relaxed">{r.owner_note}</p>
            </div>
          )}

          {/* Jetons utilisés */}
          {r.tokens_used > 0 && (
            <p className="text-[11px] text-muted-foreground mb-3">
              Coût payé : <span className="font-mono font-semibold">{r.tokens_used} jetons</span>
            </p>
          )}

          {/* Note admin (si déjà traité) */}
          {r.admin_note && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3 text-xs">
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
                Note admin
              </p>
              <p className="text-foreground/90 leading-relaxed">{r.admin_note}</p>
            </div>
          )}

          {/* Actions */}
          {r.status === "pending" && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() =>
                  onApprove(r.id, r.properties?.title ?? "cette annonce")
                }
                disabled={pending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-verified text-verified-foreground hover:opacity-90"
              >
                <BadgeCheck className="size-3.5" />
                Valider — Accorder badge ✓
              </button>
              <button
                onClick={() => onReject(r.id, r.tokens_used > 0)}
                disabled={pending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                <X className="size-3.5" />
                Refuser
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span
        title="Validée"
        className="size-7 grid place-items-center rounded-full bg-verified/20 text-verified shrink-0"
      >
        <Check className="size-3.5" />
      </span>
    );
  if (status === "rejected")
    return (
      <span
        title="Refusée"
        className="size-7 grid place-items-center rounded-full bg-destructive/20 text-destructive shrink-0"
      >
        <X className="size-3.5" />
      </span>
    );
  return (
    <span
      title="En attente"
      className="size-7 grid place-items-center rounded-full bg-premium/30 text-premium-foreground shrink-0"
    >
      <Clock className="size-3.5" />
    </span>
  );
}
