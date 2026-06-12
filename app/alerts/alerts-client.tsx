"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Plus, Trash2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import {
  createAlertAction,
  deleteAlertAction,
  toggleAlertAction,
} from "@/lib/actions/alerts";
import { formatAr, propertyTypeLabel, listingTypeLabel, titleCase } from "@/lib/format";
import type { Alert } from "@/lib/types";

export function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createAlertAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Alerte créée 🔔");
      setShowForm(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette alerte ?")) return;
    startTransition(async () => {
      await deleteAlertAction(id);
      toast.success("Alerte supprimée");
      router.refresh();
    });
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      await toggleAlertAction(id);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="mb-6 inline-flex items-center gap-2 px-5 min-h-12 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90"
      >
        <Plus className="size-4" />
        {showForm ? "Annuler" : "Nouvelle alerte"}
      </button>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-8 space-y-4 animate-fade-up"
        >
          <h2 className="font-display text-xl italic">Créer une alerte</h2>
          <Field label="Nom de l'alerte" required>
            <input
              name="name"
              required
              minLength={3}
              placeholder="Ex: T3 à louer Antananarivo"
              disabled={pending}
              className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville">
              <input
                name="city"
                placeholder="Antananarivo"
                disabled={pending}
                className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Type de bien">
              <select
                name="type"
                disabled={pending}
                className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base"
              >
                <option value="">Tous</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="local_commercial">Local</option>
                <option value="terrain">Terrain</option>
              </select>
            </Field>
            <Field label="Transaction">
              <select
                name="listing"
                disabled={pending}
                className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base"
              >
                <option value="">Location & vente</option>
                <option value="rent">À louer</option>
                <option value="sale">À vendre</option>
              </select>
            </Field>
            <Field label="Budget max (Ar)">
              <input
                name="pmax"
                type="number"
                min="0"
                placeholder="3 000 000"
                disabled={pending}
                className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base font-mono"
              />
            </Field>
            <Field label="Surface min (m²)">
              <input
                name="smin"
                type="number"
                min="0"
                disabled={pending}
                className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base"
              />
            </Field>
            <Field label="Pièces min">
              <input
                name="rooms"
                type="number"
                min="0"
                disabled={pending}
                className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base"
              />
            </Field>
          </div>

          <Field label="Fréquence des notifications" required>
            <select
              name="frequency"
              defaultValue="daily"
              disabled={pending}
              className="w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base"
            >
              <option value="instant">Instantané (chaque nouveau bien)</option>
              <option value="daily">Quotidien (résumé chaque matin)</option>
              <option value="weekly">Hebdomadaire (résumé du lundi)</option>
            </select>
          </Field>

          <button
            type="submit"
            disabled={pending}
            className="w-full min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Création…" : "Créer l'alerte"}
          </button>
        </form>
      )}

      {/* Liste des alertes */}
      {initialAlerts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card">
          <Bell className="size-10 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            Aucune alerte. Créez-en une pour ne plus rater une bonne affaire.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialAlerts.map((a) => (
            <article
              key={a.id}
              className="bg-card border border-border rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm md:text-base truncate">
                    {a.name}
                  </h3>
                  {!a.is_active && (
                    <span className="text-[10px] uppercase tracking-widest font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      Pausée
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summarizeFilters(a.filters)} ·{" "}
                  <span className="capitalize">{translateFrequency(a.frequency)}</span>
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(a.id)}
                  aria-label={a.is_active ? "Mettre en pause" : "Activer"}
                  className="size-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground"
                >
                  {a.is_active ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  aria-label="Supprimer"
                  className="size-9 grid place-items-center rounded-md hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 inline-block">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

function summarizeFilters(f: any): string {
  const parts: string[] = [];
  if (f.city) parts.push(titleCase(f.city));
  if (f.type) parts.push(propertyTypeLabel(f.type));
  if (f.listing) parts.push(listingTypeLabel(f.listing));
  if (f.pmax) parts.push(`max ${formatAr(f.pmax)}`);
  if (f.smin) parts.push(`≥${f.smin}m²`);
  if (f.rooms) parts.push(`≥${f.rooms} pièces`);
  return parts.length > 0 ? parts.join(" · ") : "Tous les biens";
}

function translateFrequency(f: string) {
  return { instant: "instantané", daily: "quotidien", weekly: "hebdomadaire" }[f as string] ?? f;
}
