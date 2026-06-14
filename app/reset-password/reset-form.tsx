"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { resetPasswordAction } from "@/lib/actions/auth";

export function ResetForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Mot de passe mis à jour 🎉");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl italic mb-2 text-primary">
          Nouveau mot de passe
        </h1>
        <p className="text-muted-foreground text-sm">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5"
      >
        <div>
          <label
            htmlFor="password"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            disabled={pending}
            className="mt-1.5 w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Au moins 6 caractères.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
