"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Sparkles, Coins, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { updateSettingsAction, updatePackAction, createPackAction, deletePackAction } from "@/lib/actions/admin";
import { formatAr } from "@/lib/format";

interface Settings {
  unlock_cost: number;
  unlock_cost_rent: number | null;
  unlock_cost_sale: number | null;
  unlock_cost_rent_verified: number | null;
  unlock_cost_rent_unverified: number | null;
  unlock_cost_sale_verified: number | null;
  unlock_cost_sale_unverified: number | null;
  verification_cost: number;
  boost_cost: number;
  boost_duration_days: number;
  free_unlocks_per_day: number;
  free_mode_until: string | null;
  purchase_instructions: string;
  site_name: string;
  support_email: string;
  support_phone: string;
}

interface Pack {
  id: string;
  size: number;
  price_ar: number;
  label: string | null;
  badge: string | null;
  is_active: boolean;
}

export function SettingsForm({
  settings,
  packs,
}: {
  settings: Settings;
  packs: Pack[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleGlobal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateSettingsAction(fd);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Paramètres enregistrés");
        router.refresh();
      }
    });
  };

  const freeModeActive = settings.free_mode_until
    ? new Date(settings.free_mode_until).getTime() > Date.now()
    : false;

  return (
    <div className="space-y-6">
      {/* === SECTION 1 — TARIFS ET RÈGLES === */}
      <form onSubmit={handleGlobal} className="space-y-6">
        <Section title="Tarifs déblocage par type d'annonce" icon={<Coins className="size-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div></div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-verified">
                ✓ Vérifiée
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Non vérifiée
              </p>
            </div>

            <div className="md:text-right md:pr-2">
              <p className="text-xs font-semibold uppercase tracking-wider">📦 Location</p>
            </div>
            <Field label="">
              <NumberInput
                name="unlock_cost_rent_verified"
                defaultValue={settings.unlock_cost_rent_verified ?? settings.unlock_cost_rent ?? settings.unlock_cost}
                min={0}
              />
            </Field>
            <Field label="">
              <NumberInput
                name="unlock_cost_rent_unverified"
                defaultValue={settings.unlock_cost_rent_unverified ?? settings.unlock_cost_rent ?? settings.unlock_cost}
                min={0}
              />
            </Field>

            <div className="md:text-right md:pr-2">
              <p className="text-xs font-semibold uppercase tracking-wider">🏠 Vente</p>
            </div>
            <Field label="">
              <NumberInput
                name="unlock_cost_sale_verified"
                defaultValue={settings.unlock_cost_sale_verified ?? settings.unlock_cost_sale ?? settings.unlock_cost}
                min={0}
              />
            </Field>
            <Field label="">
              <NumberInput
                name="unlock_cost_sale_unverified"
                defaultValue={settings.unlock_cost_sale_unverified ?? settings.unlock_cost_sale ?? settings.unlock_cost}
                min={0}
              />
            </Field>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            💡 Le coût varie selon que l&apos;annonce est en location ou en vente, et selon qu&apos;elle est vérifiée ✓ ou non. Les annonces vérifiées peuvent justifier un coût plus élevé car elles sont plus fiables.
          </p>
        </Section>

        <Section title="Autres tarifs" icon={<Coins className="size-4" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Déblocage (défaut)">
              <NumberInput
                name="unlock_cost"
                defaultValue={settings.unlock_cost}
                min={0}
              />
            </Field>
            <Field label="Vérification annonce">
              <NumberInput
                name="verification_cost"
                defaultValue={settings.verification_cost}
                min={0}
              />
            </Field>
            <Field label="Boost annonce">
              <NumberInput
                name="boost_cost"
                defaultValue={settings.boost_cost}
                min={0}
              />
            </Field>
            <Field label="Durée boost (jours)">
              <NumberInput
                name="boost_duration_days"
                defaultValue={settings.boost_duration_days}
                min={1}
              />
            </Field>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            💡 Le « Déblocage (défaut) » sert de filet de sécurité si les 4 tarifs ci-dessus sont vides.
          </p>
        </Section>

        <Section
          title="Mode promotionnel"
          subtitle="Deux modes disponibles, combinables ou non."
          icon={<Sparkles className="size-4" />}
        >
          {/* Mode A : tout gratuit pendant N jours */}
          <div className="bg-background border border-border rounded-xl p-4 mb-4">
            <h4 className="font-semibold text-sm mb-1">
              Mode A — Tout gratuit pendant N jours
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Tous les déblocages sont gratuits pour tous les utilisateurs.
            </p>
            {freeModeActive && (
              <div className="bg-verified/15 border border-verified/30 text-verified rounded-lg p-2 mb-3 text-xs">
                ✅ Actif jusqu'au{" "}
                {new Date(settings.free_mode_until!).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <Field label="Activer pour (jours)">
                  <NumberInput name="free_mode_days" defaultValue={0} min={0} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground py-2.5">
                <input type="checkbox" name="clear_free_mode" />
                Désactiver
              </label>
            </div>
          </div>

          {/* Mode B : N déblocages gratuits par jour */}
          <div className="bg-background border border-border rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-1">
              Mode B — Quota quotidien par utilisateur
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Chaque utilisateur a X déblocages gratuits par jour glissant.
              Reset automatique toutes les 24h, sans cumul.
            </p>
            <Field label="Déblocages gratuits par jour (0 = désactivé)">
              <NumberInput
                name="free_unlocks_per_day"
                defaultValue={settings.free_unlocks_per_day}
                min={0}
              />
            </Field>
          </div>
        </Section>

        <Section title="Instructions de paiement pour les jetons">
          <Field label="Texte affiché aux utilisateurs sur /tokens">
            <textarea
              name="purchase_instructions"
              defaultValue={settings.purchase_instructions}
              rows={5}
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Inclus le numéro Mvola/Orange Money à utiliser pour le paiement.
            </p>
          </Field>
        </Section>

        <Section title="Identité du site">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Nom du site">
              <TextInput name="site_name" defaultValue={settings.site_name} />
            </Field>
            <Field label="Email de support">
              <TextInput name="support_email" defaultValue={settings.support_email} type="email" />
            </Field>
            <Field label="Téléphone de support">
              <TextInput name="support_phone" defaultValue={settings.support_phone} />
            </Field>
          </div>
        </Section>

        <button
          type="submit"
          disabled={pending}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
        >
          <Save className="size-4" />
          {pending ? "Enregistrement…" : "Enregistrer les paramètres"}
        </button>
      </form>

      {/* === SECTION 2 — PACKS DE JETONS === */}
      <Section title="Packs de jetons" subtitle="Modifie le nombre de jetons, le prix et l'étiquette de chaque pack. Tu peux aussi en ajouter ou en supprimer.">
        <div className="space-y-3">
          {packs.map((p) => (
            <PackEditor key={p.id} pack={p} />
          ))}
          <NewPackForm />
        </div>
      </Section>
    </div>
  );
}

function PackEditor({ pack }: { pack: Pack }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updatePackAction(pack.id, fd);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(`Pack mis à jour`);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Supprimer définitivement le pack "${pack.size} jetons" ?\n\nCela ne supprimera PAS les achats déjà effectués.`)) return;
    startDelete(async () => {
      const res = await deletePackAction(pack.id);
      if (!res.ok) {
        toast.error("error" in res ? res.error : "Erreur");
        return;
      }
      toast.success("Pack supprimé");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background border border-border rounded-xl p-3 grid grid-cols-2 md:grid-cols-7 gap-2 items-end"
    >
      <Field label="Nb jetons">
        <NumberInput name="size" defaultValue={pack.size} min={1} />
      </Field>
      <Field label="Prix (Ar)">
        <NumberInput name="price_ar" defaultValue={pack.price_ar} min={1} />
      </Field>
      <Field label="Label">
        <TextInput name="label" defaultValue={pack.label ?? ""} placeholder="Populaire" />
      </Field>
      <Field label="Badge">
        <TextInput name="badge" defaultValue={pack.badge ?? ""} placeholder="-20%" />
      </Field>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="is_active" defaultChecked={pack.is_active} />
        Actif
      </label>
      <button
        type="submit"
        disabled={pending || deleting}
        className="min-h-10 px-3 bg-primary text-primary-foreground rounded-md text-xs font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "…" : "Enregistrer"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending || deleting}
        title="Supprimer ce pack"
        className="min-h-10 px-3 bg-destructive/10 text-destructive rounded-md text-xs font-semibold flex items-center justify-center gap-1 hover:bg-destructive/20 disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    </form>
  );
}

function NewPackForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createPackAction(fd);
      if (!res.ok) {
        toast.error("error" in res ? res.error : "Erreur");
        return;
      }
      toast.success("Pack créé");
      (e.target as HTMLFormElement).reset();
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-border rounded-xl p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="size-4" />
        Ajouter un nouveau pack
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-primary/5 border-2 border-primary/30 rounded-xl p-3 grid grid-cols-2 md:grid-cols-6 gap-2 items-end"
    >
      <Field label="Nb jetons *">
        <NumberInput name="size" defaultValue={10} min={1} required />
      </Field>
      <Field label="Prix (Ar) *">
        <NumberInput name="price_ar" defaultValue={45000} min={1} required />
      </Field>
      <Field label="Label">
        <TextInput name="label" placeholder="Populaire" />
      </Field>
      <Field label="Badge">
        <TextInput name="badge" placeholder="-20%" />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="min-h-10 px-3 bg-primary text-primary-foreground rounded-md text-xs font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "…" : "Créer"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="min-h-10 px-3 bg-muted text-muted-foreground rounded-md text-xs hover:bg-card"
      >
        Annuler
      </button>
    </form>
  );
}

// === Inputs réutilisables ===
function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5">
      <header className="mb-4 flex items-start gap-3">
        {icon && <span className="text-primary mt-0.5">{icon}</span>}
        <div>
          <h3 className="font-display text-lg italic">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </header>
      <div>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 inline-block">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      {...props}
      className="w-full min-h-10 px-3 py-2 bg-background border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      {...props}
      className="w-full min-h-10 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
