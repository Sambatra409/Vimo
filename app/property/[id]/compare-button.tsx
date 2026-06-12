"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GitCompare, Check } from "lucide-react";

const STORAGE_KEY = "vohitra-compare";
const MAX = 3;

export function CompareButton({ propertyId }: { propertyId: string }) {
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setInCompare(ids.includes(propertyId));
    } catch {}
  }, [propertyId]);

  const toggle = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let ids: string[] = raw ? JSON.parse(raw) : [];
      if (ids.includes(propertyId)) {
        ids = ids.filter((x) => x !== propertyId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        setInCompare(false);
        toast.success("Retiré du comparateur");
      } else {
        if (ids.length >= MAX) {
          toast.error(`Maximum ${MAX} annonces dans le comparateur.`);
          return;
        }
        ids.push(propertyId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        setInCompare(true);
        toast.success(`Ajouté au comparateur (${ids.length}/${MAX})`, {
          action: {
            label: "Voir",
            onClick: () => (window.location.href = "/compare"),
          },
        });
      }
    } catch {
      toast.error("Erreur de stockage local.");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`w-full min-h-12 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border ${
        inCompare
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-card border-border hover:bg-muted"
      }`}
    >
      {inCompare ? <Check className="size-4" /> : <GitCompare className="size-4" />}
      {inCompare ? "Dans le comparateur" : "Ajouter au comparateur"}
    </button>
  );
}
