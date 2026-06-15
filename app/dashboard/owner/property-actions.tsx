"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pause, Play, Trash2, MoreVertical, X } from "lucide-react";
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

  const soldLabel = listingType === "rent" ? "louee" : "vendue";
  const soldEmoji = listingType === "rent" ? "louee" : "vendue";

  const updateStatus = (newStatus: "active" | "paused" | "sold") => {
    startTransition(async () => {
      const res = await togglePropertyStatusAction(propertyId, newStatus);
      if (!res.ok) {
        toast.error(res.error ?? "Erreur");
        return;
      }
      const msg =
        newStatus === "sold"
          ? `Annonce marquee comme ${soldLabel} !`
          : newStatus === "paused"
            ? "Annonce mise en pause"
            : "Annonce reactivee";
      toast.success(msg);
      setOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (
      !confirm(
        `Supprimer definitivement "${propertyTitle}" ?\n\nCette action est IRREVERSIBLE.`,
      )
    )
      return;

    startTransition(async () => {
      const res = await deletePropertyAction(propertyId);
      if (!res.ok) {
        toast.error(res.error ?? "Erreur");
        return;
      }
      toast.success("Annonce supprimee");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={pending}
        type="button"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-muted text-foreground text-xs"
        aria-label="Plus d'actions"
      >
        <MoreVertical className="size-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border px-5 py-4 flex items-center justify-between">
              <h3 className="font-display text-lg italic truncate pr-2">
                Actions sur cette annonce
              </h3>
              <button
                onClick={() => setOpen(false)}
                type="button"
                className="size-8 grid place-items-center rounded-full hover:bg-muted shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-2 space-y-1">
              {/* Marquer comme louee/vendue */}
              {!isSold && (
                <button
                  onClick={() => updateStatus("sold")}
                  disabled={pending}
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm hover:bg-muted rounded-lg flex items-center gap-3 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-5 text-verified shrink-0" />
                  <div>
                    <p className="font-semibold">Marquer comme {soldLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      L'annonce affichera "{listingType === "rent" ? "LOUE" : "VENDU"}" et ne pourra plus etre contactee
                    </p>
                  </div>
                </button>
              )}

              {/* Reactiver */}
              {(isSold || isPaused) && (
                <button
                  onClick={() => updateStatus("active")}
                  disabled={pending}
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm hover:bg-muted rounded-lg flex items-center gap-3 disabled:opacity-50"
                >
                  <Play className="size-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold">Reactiver l'annonce</p>
                    <p className="text-xs text-muted-foreground">
                      L'annonce redevient visible et contactable
                    </p>
                  </div>
                </button>
              )}

              {/* Pauser */}
              {isActive && (
                <button
                  onClick={() => updateStatus("paused")}
                  disabled={pending}
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm hover:bg-muted rounded-lg flex items-center gap-3 disabled:opacity-50"
                >
                  <Pause className="size-5 text-premium-foreground shrink-0" />
                  <div>
                    <p className="font-semibold">Mettre en pause</p>
                    <p className="text-xs text-muted-foreground">
                      Masquer temporairement sans supprimer
                    </p>
                  </div>
                </button>
              )}

              <div className="border-t border-border my-1" />

              {/* Supprimer */}
              <button
                onClick={handleDelete}
                disabled={pending}
                type="button"
                className="w-full text-left px-4 py-3 text-sm hover:bg-destructive/10 text-destructive rounded-lg flex items-center gap-3 disabled:opacity-50"
              >
                <Trash2 className="size-5 shrink-0" />
                <div>
                  <p className="font-semibold">Supprimer definitivement</p>
                  <p className="text-xs opacity-70">
                    Irreversible : photos, favoris, messages effaces
                  </p>
                </div>
              </button>
            </div>

            <div className="border-t border-border px-5 py-3 bg-muted/30">
              <button
                onClick={() => setOpen(false)}
                type="button"
                disabled={pending}
                className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

