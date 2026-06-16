import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Mentions légales — Vohitra",
  description: "Informations légales de Vohitra, plateforme immobilière à Madagascar.",
};

export const dynamic = "force-dynamic";

export default async function MentionsLegalesPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("site_settings")
    .select("site_name, support_email, support_phone")
    .eq("id", 1)
    .single();

  const siteName = settings?.site_name ?? "Vohitra";
  const email = settings?.support_email ?? "[email à compléter via Admin]";
  const phone = settings?.support_phone ?? "[téléphone à compléter via Admin]";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl italic mb-2 text-primary">
        Mentions légales
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Version 1.0 — Mise à jour au 15 juin 2026
      </p>

      <section className="prose-section">
        <h2>1. Identification de l&apos;éditeur</h2>
        <p>
          Le site <strong>{siteName}</strong>, accessible à l&apos;adresse vohitra-imo.com,
          est édité par :
        </p>
        <ul>
          <li><strong>Dénomination :</strong> [Nom complet ou raison sociale à compléter]</li>
          <li><strong>Forme juridique :</strong> [Personne physique / Entreprise individuelle / SARL]</li>
          <li><strong>Adresse :</strong> [Adresse complète à Antananarivo, Madagascar]</li>
          <li><strong>Téléphone :</strong> {phone}</li>
          <li><strong>Email :</strong> <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a></li>
          <li><strong>NIF :</strong> [À compléter si l&apos;activité est déclarée]</li>
          <li><strong>STAT :</strong> [À compléter si applicable]</li>
        </ul>

        <h2>2. Directeur de la publication</h2>
        <p>
          Le directeur de la publication, au sens de la loi 90-031 du 21 décembre 1990, est :
          <strong> [Nom à compléter]</strong>, en qualité de [fondateur / gérant].
        </p>

        <h2>3. Hébergement</h2>
        <h3>Hébergement principal</h3>
        <ul>
          <li><strong>Société :</strong> Vercel Inc.</li>
          <li><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
          <li><strong>Site :</strong> vercel.com</li>
        </ul>
        <h3>Base de données</h3>
        <ul>
          <li><strong>Société :</strong> Supabase Inc.</li>
          <li><strong>Site :</strong> supabase.com</li>
        </ul>

        <h2>4. Cadre légal applicable</h2>
        <p>L&apos;activité s&apos;inscrit dans le respect de la législation malgache et internationale :</p>
        <ul>
          <li><strong>Loi n°2014-038</strong> sur la protection des données personnelles</li>
          <li><strong>Loi n°2016-031</strong> sur les communications électroniques</li>
          <li><strong>Loi n°2014-006</strong> sur la lutte contre la cybercriminalité</li>
          <li><strong>Code civil malgache</strong> sur les contrats et obligations</li>
          <li><strong>Loi n°94-036</strong> sur la propriété littéraire et artistique</li>
          <li><strong>Code pénal malgache</strong> sur les infractions liées aux fausses déclarations</li>
          <li><strong>RGPD (UE 2016/679)</strong> pour les utilisateurs résidant dans l&apos;Union européenne</li>
        </ul>

        <h2>5. Activité d&apos;intermédiation</h2>
        <p>
          <strong>{siteName}</strong> exerce une activité d&apos;intermédiation technique :
        </p>
        <ul>
          <li>Met à disposition une infrastructure technique permettant la rencontre entre offre et demande immobilière</li>
          <li>N&apos;est pas une agence immobilière au sens du droit malgache</li>
          <li>Ne perçoit aucune commission sur les transactions immobilières</li>
          <li>N&apos;est pas partie aux contrats conclus entre Utilisateurs</li>
          <li>N&apos;exerce aucune activité bancaire ou de paiement</li>
        </ul>

        <h2>6. Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments de la Plateforme (textes, graphismes, logos, code,
          design, marque Vohitra) est protégé par les législations en matière de propriété
          intellectuelle. Toute reproduction non autorisée est interdite et engage la
          responsabilité civile et pénale de son auteur.
        </p>

        <h2>7. Responsabilité éditoriale</h2>
        <p>
          Le directeur de la publication est responsable des contenus édités directement
          par {siteName}. La responsabilité des contenus publiés par les Utilisateurs
          (annonces, messages) incombe à leurs auteurs. {siteName} agit comme hébergeur de
          contenu utilisateur au sens de la Loi 2016-031.
        </p>

        <h2>8. Signalement de contenu illicite</h2>
        <p>
          Tout contenu illicite peut être signalé via le bouton dédié sur chaque annonce ou
          directement à <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>.
          Le signalement doit comporter :
        </p>
        <ul>
          <li>L&apos;identité du signalant</li>
          <li>L&apos;URL exacte du contenu litigieux</li>
          <li>Le motif détaillé du signalement</li>
        </ul>

        <h2>9. Cookies</h2>
        <p>
          La Plateforme utilise uniquement des cookies techniques nécessaires à son
          fonctionnement (session, préférences d&apos;affichage). Voir notre{" "}
          <Link href="/confidentialite" className="text-primary hover:underline">
            Politique de confidentialité
          </Link>.
        </p>

        <h2>10. Médiation et juridiction</h2>
        <p>
          Pour tout litige, une solution amiable est privilégiée. À défaut d&apos;accord dans
          60 jours, les juridictions d&apos;Antananarivo sont seules compétentes.
        </p>

        <h2>11. Contact</h2>
        <ul>
          <li>Email : <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a></li>
          <li>Téléphone : <span className="font-mono">{phone}</span></li>
        </ul>
      </section>

      <div className="mt-12 pt-8 border-t border-border flex gap-4 flex-wrap text-sm">
        <Link href="/cgu" className="text-primary hover:underline">Conditions générales</Link>
        <Link href="/confidentialite" className="text-primary hover:underline">Politique de confidentialité</Link>
        <Link href="/" className="text-muted-foreground hover:text-primary">Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
