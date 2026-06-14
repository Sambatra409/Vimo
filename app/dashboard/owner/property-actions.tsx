"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pause, Play, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import {
  togglePropertyStatusAction,
  deletePropertyAction,
} from "@/lib/actions/properties-crud";

interface Props {
  propertyId: string;
  propertyTitle: string;
  currentStatus: "draft" | "active" | "paused" | "archived" | "sold";
  listingType: "rent" | "sale";
}

export function PropertyActions({
  propertyId,
  propertyTitle,
  currentStatus,
  listingType,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isSold = currentStatus === "sold";
  const isPaused = currentStatus === "paused";
  const isActive = currentStatus === "active";

  const soldLabel = listingType === "rent" ? "Loué" : "Vendu";

  const updateStatus = (newStatus: "active" | "paused" | "sold") => {
    startTransition(async () => {
      const res = await togglePropertyStatusAction(propertyId, newStatus);
      if (!res.ok) {
        toast.error(res.error ?? "Erreur");
        return;
      }
      const msg =
        newStatus === "sold"
          ? `Annonce marquée comme ${soldLabel.toLowerCase()}e 🎉`
          : newStatus === "paused"
            ? "Annonce mise en pause"
            : "Annonce réactivée";
      toast.success(msg);
      setOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (
      !confirm(
        `Supprimer définitivement "${propertyTitle}" ?\n\nCette action est IRRÉVERSIBLE et supprimera aussi les photos, favoris et messages associés.`,
      )
    )
      return;

    startTransition(async () => {
      const res = await deletePropertyAction(propertyId);
      if (!res.ok) {
        toast.error(res.error ?? "Erreur");
        return;
      }
      toast.success("Annonce supprimée");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={pending}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-muted text-foreground text-xs"
        aria-label="Plus d'actions"
      >
        <MoreVertical className="size-3.5" />
      </button>

      {open && (
        <>
          {/* Overlay pour fermer au clic externe */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {/* Marquer comme loué/vendu */}
            {!isSold && (
              <button
                onClick={() => updateStatus("sold")}
                disabled={pending}
                className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="size-3.5 text-verified" />
                <span>Marquer comme {soldLabel.toLowerCase()}{listingType === "rent" ? "e" : ""}</span>
              </button>
            )}

            {/* Réactiver si vendu/loué/pausé */}
            {(isSold || isPaused) && (
              <button
                onClick={() => updateStatus("active")}
                disabled={pending}
                className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="size-3.5 text-primary" />
                <span>Réactiver l'annonce</span>
              </button>
            )}

            {/* Pauser si active */}
            {isActive && (
              <button
                onClick={() => updateStatus("paused")}
                disabled={pending}
                className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted flex items-center gap-2 disabled:opacity-50"
              >
                <Pause className="size-3.5 text-premium-foreground" />
                <span>Mettre en pause</span>
              </button>
            )}

            <div className="border-t border-border" />

            {/* Supprimer */}
            <button
              onClick={handleDelete}
              disabled={pending}
              className="w-full text-left px-3 py-2.5 text-xs hover:bg-destructive/10 text-destructive flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              <span>Supprimer définitivement</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
