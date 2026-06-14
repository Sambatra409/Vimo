"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pause, Trash2, Ban } from "lucide-react";
import { toast } from "sonner";
import { resolveReportAction } from "@/lib/actions/reports";

type ResolveType = "dismiss" | "pause_property" | "delete_property" | "ban_owner";

export function ReportActions({
  reportId,
  propertyTitle,
}: {
  reportId: string;
  propertyTitle: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handle = (action: ResolveType, confirmText: string) => {
    if (!confirm(`${confirmText}\n\nAnnonce : "${propertyTitle}"`)) return;
    const note = prompt("Note interne (optionnelle) :") ?? "";

    startTransition(async () => {
      const res = await resolveReportAction(reportId, action, note);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Action effectuée");
        router.refresh();
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => handle("dismiss", "Rejeter ce signalement (l'annonce reste en ligne) ?")}
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-muted hover:bg-muted/70 disabled:opacity-50"
      >
        <Check className="size-3.5" />
        Rejeter
      </button>
      <button
        onClick={() => handle("pause_property", "Mettre l'annonce en pause ?")}
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-premium/20 text-premium-foreground hover:opacity-80 disabled:opacity-50"
      >
        <Pause className="size-3.5" />
        Pauser annonce
      </button>
      <button
        onClick={() => handle("delete_property", "Supprimer définitivement l'annonce ?")}
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
        Supprimer annonce
      </button>
      <button
        onClick={() => handle("ban_owner", "Bannir le propriétaire ET pauser ses annonces ?")}
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50"
      >
        <Ban className="size-3.5" />
        Bannir proprio
      </button>
    </div>
  );
}
