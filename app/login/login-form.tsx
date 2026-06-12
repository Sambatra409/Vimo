"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { signInAction } from "@/lib/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Connexion réussie");
      router.push(redirectTo);
      router.refresh();
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl italic mb-2 text-primary">
          Connexion
        </h1>
        <p className="text-muted-foreground text-sm">
          Accédez à votre espace Vohitra.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5"
      >
        <div>
          <label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={pending}
            className="mt-1.5 w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Oublié ?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={pending}
            className="mt-1.5 w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-primary font-semibold hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
