"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { seedTestPropertiesAction } from "@/lib/actions/properties";

export function SeedButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (
      !confirm(
        "Créer 8 annonces de test attachées à votre compte ? (À utiliser une seule fois pour le dev)",
      )
    )
      return;

    startTransition(async () => {
      const res = await seedTestPropertiesAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${res.created} annonces de test créées 🎉`);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 min-h-12 bg-card border border-dashed border-primary/40 text-primary rounded-lg font-semibold text-sm uppercase tracking-wider hover:bg-primary/5 disabled:opacity-50"
    >
      <Sparkles className="size-4" />
      {pending ? "Création…" : "Créer 8 annonces de test"}
    </button>
  );
}
