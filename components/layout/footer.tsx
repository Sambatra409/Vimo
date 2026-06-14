import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export async function Footer() {
  // Fetch dynamique des paramètres du site (email, téléphone, etc.)
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("site_settings")
    .select("site_name, support_email, support_phone")
    .eq("id", 1)
    .single();

  const siteName = settings?.site_name ?? "Vohitra";
  const supportEmail = settings?.support_email ?? "";
  const supportPhone = settings?.support_phone ?? "";

  return (
    <footer className="bg-card border-t border-border mt-20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-4">
          <Link
            href="/"
            className="font-display text-2xl font-bold italic text-primary mb-5 inline-block"
          >
            {siteName}.
          </Link>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            La référence immobilière à Madagascar. Transparence, sécurité et proximité au service de vos projets de vie.
          </p>
        </div>

        {/* Plateforme */}
        <div className="md:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-5">Plateforme</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-primary transition-colors">Annonces</Link></li>
            <li><Link href="/tokens" className="hover:text-primary transition-colors">Acheter des jetons</Link></li>
            <li><Link href="/compare" className="hover:text-primary transition-colors">Comparateur</Link></li>
          </ul>
        </div>

        {/* Compte */}
        <div className="md:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-5">Compte</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="/login" className="hover:text-primary transition-colors">Connexion</Link></li>
            <li><Link href="/signup" className="hover:text-primary transition-colors">Inscription</Link></li>
            <li><Link href="/favorites" className="hover:text-primary transition-colors">Mes favoris</Link></li>
            <li><Link href="/alerts" className="hover:text-primary transition-colors">Mes alertes</Link></li>
          </ul>
        </div>

        {/* Légal */}
        <div className="md:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-5">Légal</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="/cgu" className="hover:text-primary transition-colors">Conditions générales</Link></li>
            <li><Link href="/confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-primary transition-colors">Mentions légales</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="col-span-2 md:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-5">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="size-4 shrink-0 mt-0.5 text-primary" />
              <span>Antananarivo, Madagascar</span>
            </li>
            {supportPhone && (
              <li className="flex items-start gap-2">
                <Phone className="size-4 shrink-0 mt-0.5 text-primary" />
                <a
                  href={`tel:${supportPhone.replace(/\s/g, "")}`}
                  className="hover:text-primary transition-colors font-mono"
                >
                  {supportPhone}
                </a>
              </li>
            )}
            {supportEmail && (
              <li className="flex items-start gap-2">
                <Mail className="size-4 shrink-0 mt-0.5 text-primary" />
                <a
                  href={`mailto:${supportEmail}`}
                  className="hover:text-primary transition-colors break-all"
                >
                  {supportEmail}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {siteName} Immobilier Madagascar. Tous droits réservés.</p>
        <p className="italic">Fait avec soin à Madagascar.</p>
      </div>
    </footer>
  );
}
