import { getSettings, listAllPacks } from "@/lib/actions/admin";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const [settings, packs] = await Promise.all([getSettings(), listAllPacks()]);

  return (
    <>
      <h2 className="font-display text-2xl italic mb-1">Paramètres</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Tarifs, mode gratuit, instructions de paiement, identité du site.
      </p>
      <SettingsForm settings={settings} packs={packs as any} />
    </>
  );
}
