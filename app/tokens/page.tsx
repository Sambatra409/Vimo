import { redirect } from "next/navigation";
import { Coins } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listMyPurchases, listActivePacks } from "@/lib/actions/tokens";
import { TokensClient } from "./tokens-client";

export default async function TokensPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/tokens");

  // Lire les paramètres globaux (instructions paiement + mode gratuit)
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("site_settings")
    .select("purchase_instructions, free_mode_until")
    .eq("id", 1)
    .single();

  const purchases = await listMyPurchases();
  const packs = await listActivePacks();

  const isFreeMode = settings?.free_mode_until
    ? new Date(settings.free_mode_until).getTime() > Date.now()
    : false;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <header className="mb-8 md:mb-10">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Espace compte
        </p>
        <h1 className="font-display text-3xl md:text-5xl italic">
          Acheter des jetons
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Les jetons servent à débloquer les contacts et booster vos annonces.
        </p>
      </header>

      {/* Solde actuel */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
            Votre solde
          </p>
          <p className="font-mono text-3xl md:text-4xl font-bold text-primary">
            {user.tokens_balance}{" "}
            <span className="text-base text-muted-foreground font-sans font-normal">
              jeton{user.tokens_balance > 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <div className="size-14 rounded-full bg-primary/10 grid place-items-center">
          <Coins className="size-6 text-primary" />
        </div>
      </div>

      {isFreeMode && (
        <div className="bg-verified/15 border border-verified/30 text-verified rounded-2xl p-4 mb-6 text-center text-sm">
          <strong>🎉 Mode promotionnel actif</strong> — Les déblocages de contact
          sont gratuits jusqu'au{" "}
          {settings?.free_mode_until &&
            new Date(settings.free_mode_until).toLocaleDateString("fr-FR")}.
          Vous pouvez acheter des jetons pour les utiliser plus tard.
        </div>
      )}

      <TokensClient
        packs={packs}
        instructions={settings?.purchase_instructions ?? ""}
        purchases={purchases}
      />
    </div>
  );
}
