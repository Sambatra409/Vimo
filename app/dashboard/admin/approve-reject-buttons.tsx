"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import {
  approveVerificationAction,
  rejectVerificationAction,
} from "@/lib/actions/verification";

export function ApproveRejectButtons({
  requestId,
  propertyTitle,
  hadTokens,
}: {
  requestId: string;
  propertyTitle: string;
  hadTokens: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleApprove = () => {
    if (!confirm(`Valider la vérification de "${propertyTitle}" ?\n\nL'annonce recevra le badge ✓ vert.`)) return;
    const note = prompt("Note (optionnelle) :") ?? "";
    startTransition(async () => {
      const res = await approveVerificationAction(requestId, note);
      if (!res.ok) toast.error(res.error ?? "Erreur");
      else {
        toast.success("Vérification approuvée ✓");
        router.refresh();
      }
    });
  };

  const handleReject = () => {
    const note = prompt("Motif du refus (visible par le propriétaire) :");
    if (!note) {
      toast.error("Motif obligatoire.");
      return;
    }
    let refund = true;
    if (hadTokens) {
      refund = confirm("Rembourser les jetons utilisés ?\n\nOK = Rembourser\nAnnuler = Ne pas rembourser");
    }
    startTransition(async () => {
      const res = await rejectVerificationAction(requestId, note, refund);
      if (!res.ok) toast.error(res.error ?? "Erreur");
      else {
        toast.success(refund ? "Refusée et remboursée" : "Refusée sans remboursement");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={pending}
        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-verified text-verified-foreground hover:opacity-90 disabled:opacity-50"
      >
        <BadgeCheck className="size-3.5" />
        Valider — Accorder badge ✓
      </button>
      <button
        onClick={handleReject}
        disabled={pending}
        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
      >
        <X className="size-3.5" />
        Refuser
      </button>
    </div>
  );
}
