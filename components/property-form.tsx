"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PhotoUpload } from "./photo-upload";
import {
  createPropertyAction,
  updatePropertyAction,
} from "@/lib/actions/properties-crud";
import type { PropertyType, ListingType } from "@/lib/types";

interface InitialData {
  id?: string;
  title?: string;
  description?: string;
  property_type?: PropertyType;
  listing_type?: ListingType;
  price?: number;
  surface?: number;
  rooms?: number | null;
  address?: string;
  city?: string;
  postal_code?: string | null;
  photos?: { url: string; display_order: number }[];
}

export function PropertyForm({ initial }: { initial?: InitialData }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initial?.property_type ?? "appartement",
  );
  const [listingType, setListingType] = useState<ListingType>(
    initial?.listing_type ?? "rent",
  );
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [surface, setSurface] = useState(String(initial?.surface ?? ""));
  const [rooms, setRooms] = useState(
    initial?.rooms != null ? String(initial.rooms) : "",
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postal_code ?? "");
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initial?.photos?.sort((a, b) => a.display_order - b.display_order).map((p) => p.url) ?? [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      title,
      description,
      property_type: propertyType,
      listing_type: listingType,
      price: Number(price.replace(/\s/g, "")),
      surface: Number(surface),
      rooms: rooms ? Number(rooms) : null,
      address,
      city,
      postal_code: postalCode || null,
      photos: photoUrls,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updatePropertyAction(initial!.id!, input)
        : await createPropertyAction(input);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success(isEdit ? "Annonce modifiée 🎉" : "Annonce publiée 🎉");
      const targetId = isEdit ? initial!.id! : (res as any).id;
      router.push(`/property/${targetId}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/owner"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Retour au dashboard
      </Link>

      <header>
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Espace propriétaire
        </p>
        <h1 className="font-display text-3xl md:text-5xl italic">
          {isEdit ? "Modifier l'annonce" : "Nouvelle annonce"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {isEdit
            ? "Toute modification d'annonce supprime le badge vérifié — il faudra refaire valider."
            : "Renseignez les informations clés de votre bien. Soyez précis : ça augmente vos chances."}
        </p>
      </header>

      {/* Section 1 — Photos */}
      <Section title="Photos" subtitle="Jusqu'à 5 photos. La première est la photo de couverture.">
        <PhotoUpload
          initialUrls={photoUrls}
          onChange={setPhotoUrls}
          propertyId={initial?.id ?? "draft"}
          maxPhotos={5}
        />
      </Section>

      {/* Section 2 — Type */}
      <Section title="Type de bien" subtitle="">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(["appartement", "maison", "local_commercial", "terrain"] as PropertyType[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPropertyType(t)}
                className={`min-h-12 py-3 px-3 rounded-lg border text-sm font-semibold ${
                  propertyType === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary"
                }`}
              >
                {labelType(t)}
              </button>
            ),
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {(["rent", "sale"] as ListingType[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setListingType(l)}
              className={`min-h-12 py-3 px-4 rounded-lg border text-sm font-semibold ${
                listingType === l
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary"
              }`}
            >
              {l === "rent" ? "À louer" : "À vendre"}
            </button>
          ))}
        </div>
      </Section>

      {/* Section 3 — Titre & description */}
      <Section title="Présentation" subtitle="Évitez d'écrire vos coordonnées : elles seront détectées et bloquées.">
        <Field label="Titre" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
            maxLength={120}
            placeholder="Ex: Appartement T3 lumineux à Ivandry"
            disabled={pending}
            className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Description" required>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={20}
            rows={6}
            placeholder="Décrivez votre bien : surfaces, équipements, voisinage, atouts…"
            disabled={pending}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {description.length} caractères (min. 20)
          </p>
        </Field>
      </Section>

      {/* Section 4 — Caractéristiques */}
      <Section title="Caractéristiques" subtitle="">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Prix (Ar)" required>
            <input
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d\s]/g, ""))}
              required
              placeholder="1 800 000"
              disabled={pending}
              className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Surface (m²)" required>
            <input
              type="number"
              min="1"
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              required
              placeholder="85"
              disabled={pending}
              className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field
            label="Pièces"
            optional={propertyType === "terrain" || propertyType === "local_commercial"}
          >
            <input
              type="number"
              min="0"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              placeholder="3"
              disabled={pending}
              className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
        </div>
      </Section>

      {/* Section 5 — Adresse */}
      <Section title="Adresse" subtitle="Pour le moment l'adresse exacte est visible uniquement après déblocage du contact.">
        <Field label="Adresse" required>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="Lot II A 23 Ivandry"
            disabled={pending}
            className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Field label="Ville" required>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="Antananarivo"
              disabled={pending}
              className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Code postal" optional>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="101"
              disabled={pending}
              className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
        </div>
      </Section>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Save className="size-4" />
          {pending
            ? "Envoi…"
            : isEdit
              ? "Enregistrer les modifications"
              : "Publier l'annonce"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 md:p-6">
      <header className="mb-4">
        <h2 className="font-display text-xl italic">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </header>
      <div>{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 inline-block">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
        {optional && (
          <span className="text-muted-foreground/60 ml-1 normal-case font-normal lowercase">
            (optionnel)
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function labelType(t: PropertyType) {
  return {
    appartement: "Appartement",
    maison: "Maison",
    local_commercial: "Local",
    terrain: "Terrain",
  }[t];
}
