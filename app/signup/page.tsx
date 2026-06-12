"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { signUpAction } from "@/lib/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"locataire" | "proprietaire">("locataire");
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!acceptCgu) {
      toast.error("Vous devez accepter les CGU pour créer un compte.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    // On force la valeur du rôle depuis l'état (les boutons sont type=button)
    formData.set("role", role);

    startTransition(async () => {
      const result = await signUpAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const email = String(formData.get("email") ?? "");
      toast.success("Compte créé !");
      router.push(`/signup/confirm?email=${encodeURIComponent(email)}`);
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl italic mb-2 text-primary">
          Inscription
        </h1>
        <p className="text-muted-foreground text-sm">Rejoignez la communauté Vohitra.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-6"
      >
        {/* Bloc 1 — Rôle */}
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Je suis
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {(["locataire", "proprietaire"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={`min-h-12 py-3 px-4 rounded-lg border text-sm font-semibold transition-colors ${
                  role === r
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary"
                }`}
              >
                {r === "locataire" ? "Locataire" : "Propriétaire"}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Bloc 2 — Identité */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Nom complet
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              minLength={2}
              disabled={pending}
              className="mt-1.5 w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="034 00 000 00"
              disabled={pending}
              className="mt-1.5 w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        {/* Bloc 3 — Identifiants */}
        <div className="space-y-4">
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
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Mot de passe
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
              Au moins 6 caractères. Choisissez quelque chose de mémorable.
            </p>
          </div>
        </div>

        {/* CGU */}
        <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            name="acceptCgu"
            checked={acceptCgu}
            onChange={(e) => setAcceptCgu(e.target.checked)}
            disabled={pending}
            className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          <span>
            J'accepte les{" "}
            <Link
              href="/cgu"
              target="_blank"
              className="text-primary font-semibold hover:underline"
            >
              Conditions Générales d'Utilisation
            </Link>{" "}
            de Vohitra.
          </span>
        </label>

        <button
          type="submit"
          disabled={pending || !acceptCgu}
          className="w-full min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
