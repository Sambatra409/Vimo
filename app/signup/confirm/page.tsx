import Link from "next/link";
import { Mail } from "lucide-react";

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function SignupConfirmPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
      <div className="size-16 mx-auto mb-6 rounded-full bg-primary/10 text-primary grid place-items-center">
        <Mail className="size-8" />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl italic mb-3 text-primary">
        Vérifiez votre boîte mail
      </h1>
      <p className="text-muted-foreground text-sm mb-2">
        Nous avons envoyé un lien de confirmation à
      </p>
      {email && <p className="font-mono text-sm font-medium mb-6">{email}</p>}
      <p className="text-sm text-muted-foreground mb-8">
        Cliquez sur le lien dans l'email pour activer votre compte, puis revenez vous connecter.
      </p>

      <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-3 text-sm">
        <h3 className="font-semibold text-foreground">Vous n'avez pas reçu l'email ?</h3>
        <ul className="space-y-1.5 text-muted-foreground text-xs leading-relaxed">
          <li>• Vérifiez votre dossier de courrier indésirable / spam</li>
          <li>• L'email peut prendre quelques minutes à arriver</li>
          <li>• Vérifiez que vous avez bien saisi votre adresse email</li>
        </ul>
      </div>

      <Link
        href="/login"
        className="inline-block mt-8 text-sm font-medium text-primary hover:underline"
      >
        Aller à la connexion
      </Link>
    </div>
  );
}
