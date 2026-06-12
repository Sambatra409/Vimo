"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      toast.success("Email envoyé si le compte existe.");
    });
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <h1 className="font-display text-3xl italic mb-3 text-primary">
          Email envoyé
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes.
        </p>
        <Link href="/login" className="text-sm text-primary font-medium hover:underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl italic mb-2 text-primary">
          Mot de passe oublié
        </h1>
        <p className="text-muted-foreground text-sm">
          Saisissez votre email, nous vous enverrons un lien pour le réinitialiser.
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

        <button
          type="submit"
          disabled={pending}
          className="w-full min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Envoi..." : "Envoyer le lien"}
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
