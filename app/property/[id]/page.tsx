import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Sparkles, MapPin, Maximize, BedDouble, ArrowLeft } from "lucide-react";
import {
  getPropertyById,
  isContactUnlocked,
  isFavorited,
  trackPropertyView,
} from "@/lib/actions/properties";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatAr, propertyTypeLabel, titleCase, listingTypeLabel } from "@/lib/format";
import { PropertyGallery } from "./property-gallery";
import { ContactPanel } from "./contact-panel";
import { FavoriteButton } from "./favorite-button";
import { CompareButton } from "./compare-button";
import { VerificationButton } from "./verification-button";
import { getVerificationStatus } from "@/lib/actions/verification";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === property.owner_id;

  // Charger en parallèle : statut déblocage, favori, settings + vérif si owner
  const [unlocked, favorited, settings, verifStatus] = await Promise.all([
    isContactUnlocked(id),
    isFavorited(id),
    fetchSettings(),
    isOwner ? getVerificationStatus(id) : Promise.resolve(null),
  ]);

  // Track view (fire & forget, ne bloque pas le rendu)
  if (!isOwner) {
    trackPropertyView(id).catch(() => {});
  }

  const title = titleCase(property.title);
  const city = titleCase(property.city);
  const isSale = property.listing_type === "sale";

  const isFreeMode = settings?.free_mode_until
    ? new Date(settings.free_mode_until).getTime() > Date.now()
    : false;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      {/* Lien retour */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 md:mb-6"
      >
        <ArrowLeft className="size-4" />
        Retour aux annonces
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        {/* Colonne principale (galerie + descriptif) */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <PropertyGallery photos={property.photos} title={title} />

          {/* Titre + badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground px-2 py-1 bg-muted rounded-md">
                {propertyTypeLabel(property.property_type)}
              </span>
              <span className="text-[11px] uppercase tracking-widest font-bold text-primary px-2 py-1 bg-primary/10 rounded-md">
                {listingTypeLabel(property.listing_type)}
              </span>
              {property.is_verified && (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest font-bold px-2 py-1 bg-verified/15 text-verified rounded-md">
                  <BadgeCheck className="size-3" />
                  Vérifiée
                </span>
              )}
              {property.is_premium && (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest font-bold px-2 py-1 bg-premium/20 text-premium-foreground rounded-md">
                  <Sparkles className="size-3" />
                  Premium
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl leading-tight italic mb-3">
              {title}
            </h1>

            <p className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-4" />
              {city}
            </p>
          </div>

          {/* Caractéristiques clés */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <KeyFigure
              icon={<Maximize className="size-4" />}
              label="Surface"
              value={`${property.surface} m²`}
            />
            <KeyFigure
              icon={<BedDouble className="size-4" />}
              label="Pièces"
              value={property.rooms ? `${property.rooms}` : "—"}
            />
            <KeyFigure
              label="Prix"
              value={formatAr(property.price)}
              mono
              valueClass="text-primary"
            />
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <h2 className="font-display text-xl md:text-2xl italic mb-3">
                Descriptif
              </h2>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {property.description}
              </p>
            </div>
          )}

          {/* Adresse */}
          <div>
            <h2 className="font-display text-xl md:text-2xl italic mb-3">
              Adresse
            </h2>
            <p className="text-foreground/90 text-sm md:text-base">
              {property.address}
              {property.postal_code ? `, ${property.postal_code}` : ""}
              <br />
              <span className="text-muted-foreground">{city}</span>
            </p>
          </div>
        </div>

        {/* Sidebar — sticky sur desktop */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* Prix gros */}
            <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                {isSale ? "Prix d'achat" : "Loyer mensuel"}
              </p>
              <p className="font-mono text-2xl md:text-3xl font-bold text-primary mb-1">
                {formatAr(property.price)}
              </p>
              <p className="text-xs text-muted-foreground">
                Soit {formatAr(Math.round(property.price / property.surface))} / m²
              </p>
            </div>

            {/* Panneau contact (client) */}
            {!isOwner && (
              <ContactPanel
                propertyId={property.id}
                initialUnlocked={unlocked}
                isLoggedIn={!!user}
                isFreeMode={isFreeMode}
                unlockCost={settings?.unlock_cost ?? 1}
              />
            )}

            {/* Bouton favoris */}
            {!isOwner && user && (
              <FavoriteButton
                propertyId={property.id}
                initialFavorited={favorited}
              />
            )}

            {/* Bouton comparateur (toujours visible, localStorage) */}
            {!isOwner && <CompareButton propertyId={property.id} />}

            {isOwner && (
              <>
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                    Votre annonce
                  </p>
                  <p className="text-sm mb-3">
                    Vous êtes le propriétaire de cette annonce.
                  </p>
                  <Link
                    href={`/property/${property.id}/edit`}
                    className="block w-full text-center min-h-10 py-2 bg-card border border-border rounded-lg text-sm font-semibold hover:bg-muted"
                  >
                    Modifier l'annonce
                  </Link>
                </div>

                <VerificationButton
                  propertyId={property.id}
                  isVerified={property.is_verified}
                  verificationStatus={(verifStatus?.status as any) ?? "none"}
                  adminNote={verifStatus?.admin_note ?? null}
                  isFreeMode={isFreeMode}
                  verificationCost={settings?.verification_cost ?? 10}
                  userTokens={user?.tokens_balance ?? 0}
                />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function KeyFigure({
  icon,
  label,
  value,
  mono = false,
  valueClass = "",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 md:p-4">
      {icon && <div className="text-primary mb-1.5">{icon}</div>}
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={`text-base md:text-lg font-semibold leading-tight ${mono ? "font-mono" : ""} ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

async function fetchSettings() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("unlock_cost, verification_cost, free_mode_until")
    .eq("id", 1)
    .single();
  return data;
}
