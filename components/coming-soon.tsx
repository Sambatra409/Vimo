import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  step: number;
}

/**
 * Page placeholder élégante pour les fonctionnalités à venir.
 * Plus jolie qu'un 404, garde l'utilisateur dans le flow.
 */
export function ComingSoon({ icon, title, description, features, step }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center animate-fade-up">
      <div className="size-16 mx-auto mb-6 rounded-full bg-primary/10 text-primary grid place-items-center">
        {icon}
      </div>

      <span className="inline-block text-[10px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
        Étape {step} · Bientôt disponible
      </span>

      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl italic mb-3">
        {title}
      </h1>

      <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-md mx-auto">
        {description}
      </p>

      {/* Liste des features prévues */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 text-left mb-8">
        <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary" />
          Ce qu'on va construire
        </h3>
        <ul className="space-y-2 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
      >
        <ArrowLeft className="size-4" />
        Retour aux annonces
      </Link>
    </div>
  );
}
