"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/lib/actions/properties";

interface Props {
  propertyId: string;
  initialFavorited: boolean;
}

export function FavoriteButton({ propertyId, initialFavorited }: Props) {
  const [isFav, setIsFav] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    // Optimistic update
    const next = !isFav;
    setIsFav(next);

    startTransition(async () => {
      const res = await toggleFavoriteAction(propertyId);
      if (!res.ok) {
        // Rollback en cas d'erreur
        setIsFav(!next);
        toast.error(res.error);
        return;
      }
      toast.success(res.isFavorite ? "Ajouté aux favoris" : "Retiré des favoris");
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={isFav}
      className={`w-full min-h-12 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border ${
        isFav
          ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15"
          : "bg-card border-border hover:bg-muted"
      }`}
    >
      <Heart className={`size-4 ${isFav ? "fill-current" : ""}`} />
      {isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
    </button>
  );
}
