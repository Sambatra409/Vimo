import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Vohitra",
  description: "CGU de la plateforme immobilière Vohitra à Madagascar.",
};

export default function CguPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl italic mb-2 text-primary">
        Conditions Générales d&apos;Utilisation
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Version 1.0 — En vigueur au 15 juin 2026
      </p>

      <section className="prose-section">
        <h2>Article 1 — Objet et acceptation</h2>
        <p>
          Les présentes Conditions Générales d&apos;Utilisation régissent les relations entre
          la plateforme Vohitra, accessible à l&apos;adresse vohitra-imo.com, et toute personne
          utilisant ses services (ci-après l&apos;Utilisateur).
        </p>
        <p>
          L&apos;accès et l&apos;utilisation de la Plateforme impliquent l&apos;acceptation sans réserve
          des présentes CGU. Tout Utilisateur qui n&apos;accepte pas l&apos;intégralité des CGU doit
          cesser immédiatement d&apos;utiliser la Plateforme.
        </p>
        <p>
          Les présentes CGU sont régies par la loi malgache, en particulier le Code civil,
          la Loi n°2014-038 du 9 janvier 2015 sur la protection des données à caractère personnel,
          et la Loi n°2016-031 du 24 août 2017 régissant les communications électroniques.
        </p>

        <h2>Article 2 — Description du service</h2>
        <p>
          Vohitra est une plateforme numérique d&apos;intermédiation immobilière. Elle met en
          relation des propriétaires souhaitant louer ou vendre un bien immobilier avec des
          personnes recherchant un tel bien.
        </p>
        <p>
          <strong>Vohitra agit uniquement en qualité d&apos;intermédiaire technique.</strong> La
          Plateforme n&apos;est pas partie aux contrats de location ou de vente conclus entre
          les Utilisateurs. Vohitra ne perçoit aucune commission sur les transactions
          immobilières et n&apos;intervient pas dans la conclusion ou l&apos;exécution des contrats.
        </p>

        <h2>Article 3 — Inscription et compte</h2>
        <p>
          L&apos;inscription est gratuite et accessible aux personnes physiques majeures
          (18 ans révolus). L&apos;Utilisateur s&apos;engage à fournir des informations exactes,
          complètes et conformes à son identité.
        </p>
        <p>
          L&apos;Utilisateur est seul responsable de la confidentialité de ses identifiants.
          Un Utilisateur ne peut détenir qu&apos;un seul compte. La création de comptes multiples
          entraîne la suppression de l&apos;ensemble des comptes.
        </p>

        <h2>Article 4 — Publication d&apos;annonces</h2>
        <p>Le Propriétaire qui publie une annonce déclare et garantit :</p>
        <ul>
          <li>Être titulaire d&apos;un droit réel sur le bien</li>
          <li>Disposer du droit de mettre le bien en location ou en vente</li>
          <li>Que toutes les informations fournies sont exactes</li>
          <li>Que les photographies représentent fidèlement le bien</li>
        </ul>
        <p>Il est strictement interdit d&apos;insérer dans une annonce :</p>
        <ul>
          <li>Des coordonnées dans le titre, la description ou les photographies</li>
          <li>Des références à d&apos;autres plateformes</li>
          <li>Des informations mensongères ou trompeuses</li>
          <li>Des contenus discriminatoires</li>
        </ul>

        <h2>Article 5 — Système de jetons</h2>
        <p>
          L&apos;accès aux coordonnées d&apos;un Propriétaire et les services premium sont soumis
          à l&apos;utilisation de jetons numériques. Ces jetons constituent une licence d&apos;accès
          à un service numérique et non un moyen de paiement.
        </p>
        <p>
          L&apos;achat de Jetons s&apos;effectue par packs prédéfinis via Mvola, Orange Money ou
          Airtel Money. Après paiement, l&apos;Utilisateur saisit la référence de transaction.
          La validation est effectuée sous 24 à 48 heures ouvrées.
        </p>
        <p>
          <strong>Les Jetons achetés ne sont ni remboursables ni transférables.</strong> Aucun
          droit de rétractation ne s&apos;applique aux services numériques fournis. Les Jetons
          consommés ne peuvent être restitués.
        </p>

        <h2>Article 6 — Messagerie et signalement</h2>
        <p>
          La Plateforme intègre un système de messagerie. L&apos;Utilisateur s&apos;engage à rester
          courtois, à ne pas envoyer de spam, ni de menaces. Vohitra peut accéder aux messages
          en cas de signalement.
        </p>
        <p>
          Tout Utilisateur peut signaler une annonce frauduleuse ou inappropriée. Les
          signalements abusifs peuvent entraîner des sanctions contre leur auteur.
        </p>

        <h2>Article 7 — Sanctions</h2>
        <p>Tout manquement aux CGU peut donner lieu à :</p>
        <ul>
          <li>Un avertissement formel</li>
          <li>La suppression de l&apos;annonce ou du contenu litigieux</li>
          <li>La suspension temporaire ou définitive du compte</li>
          <li>Le signalement aux autorités en cas d&apos;infraction pénale</li>
        </ul>

        <h2>Article 8 — Limitation de responsabilité</h2>
        <p>Vohitra ne peut être tenue responsable :</p>
        <ul>
          <li>De la véracité des annonces publiées par les Propriétaires</li>
          <li>De la solvabilité ou de l&apos;honnêteté des Utilisateurs</li>
          <li>Des litiges nés entre Utilisateurs</li>
          <li>Des arnaques commises entre Utilisateurs</li>
          <li>Des interruptions techniques temporaires</li>
        </ul>
        <p>
          L&apos;Utilisateur reconnaît qu&apos;il lui incombe de vérifier la légalité, la
          disponibilité et l&apos;état du bien avant tout engagement contractuel.
        </p>

        <h2>Article 9 — Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments composant la Plateforme est protégé par la législation
          malgache (loi 94-036) et internationale sur la propriété intellectuelle. Toute
          reproduction non autorisée est interdite et constitue une contrefaçon.
        </p>

        <h2>Article 10 — Données personnelles</h2>
        <p>
          Le traitement des données est régi par notre{" "}
          <Link href="/confidentialite" className="text-primary hover:underline">
            Politique de confidentialité
          </Link>
          , conforme à la Loi 2014-038 (Madagascar) et au RGPD européen.
        </p>

        <h2>Article 11 — Modification des CGU</h2>
        <p>
          Vohitra se réserve le droit de modifier les CGU à tout moment. Les modifications
          substantielles sont notifiées 15 jours avant entrée en vigueur. La poursuite de
          l&apos;utilisation vaut acceptation.
        </p>

        <h2>Article 12 — Loi applicable et juridiction</h2>
        <p>
          Les présentes CGU sont soumises au droit malgache. En cas de litige, les parties
          rechercheront une solution amiable. À défaut, les tribunaux d&apos;Antananarivo
          seront seuls compétents.
        </p>
      </section>

      <div className="mt-12 pt-8 border-t border-border flex gap-4 flex-wrap text-sm">
        <Link href="/mentions-legales" className="text-primary hover:underline">
          Mentions légales
        </Link>
        <Link href="/confidentialite" className="text-primary hover:underline">
          Politique de confidentialité
        </Link>
        <Link href="/" className="text-muted-foreground hover:text-primary">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
