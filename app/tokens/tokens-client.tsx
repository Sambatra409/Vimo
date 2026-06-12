"use client";

import { useState, useTransition } from "react";
import { Check, Clock, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createTokenPurchaseAction } from "@/lib/actions/tokens";
import { formatAr } from "@/lib/format";
import type { TokenPack, TokenPurchase } from "@/lib/types";

interface Props {
  packs: TokenPack[];
  instructions: string;
  purchases: TokenPurchase[];
}

export function TokensClient({ packs, instructions, purchases }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<TokenPack | null>(null);
  const [method, setMethod] = useState("mvola");
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) {
      toast.error("Sélectionnez un pack.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("packSize", String(selected.size));
    fd.set("method", method);

    startTransition(async () => {
      const res = await createTokenPurchaseAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        "Demande envoyée. Vous serez notifié dès validation par notre équipe.",
      );
      setSelected(null);
      setReference("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {/* Packs */}
      <section>
        <h2 className="font-display text-xl italic mb-4">Choisir un pack</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          {packs.map((p) => {
            const isSelected = selected?.size === p.size;
            return (
              <button
                key={p.size}
                type="button"
                onClick={() => setSelected(p)}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-premium text-premium-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    <Sparkles className="size-2.5" />
                    {p.badge}
                  </span>
                )}
                <p className="font-mono text-2xl md:text-3xl font-bold text-primary">
                  {p.size}
                </p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  jeton{p.size > 1 ? "s" : ""}
                </p>
                <p className="font-mono text-sm font-semibold mt-2">
                  {formatAr(p.price_ar)}
                </p>
                {p.label && (
                  <p className="text-[10px] text-muted-foreground mt-1">{p.label}</p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Formulaire de paiement */}
      {selected && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5 animate-fade-up"
        >
          <header>
            <h3 className="font-display text-xl italic">Confirmer l'achat</h3>
            <p className="text-sm text-muted-foreground">
              Pack de <strong>{selected.size} jetons</strong> pour{" "}
              <strong className="font-mono">{formatAr(selected.price_ar)}</strong>
            </p>
          </header>

          {/* Étapes du paiement — explication claire */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Comment ça marche
            </h4>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="size-6 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">1</span>
                <span>Effectuez le paiement de <strong className="font-mono">{formatAr(selected.price_ar)}</strong> par {method === "mvola" ? "Mvola" : method === "orange_money" ? "Orange Money" : "Airtel Money"} selon les instructions ci-dessous.</span>
              </li>
              <li className="flex gap-3">
                <span className="size-6 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">2</span>
                <span>Notez la <strong>référence de transaction</strong> reçue par SMS.</span>
              </li>
              <li className="flex gap-3">
                <span className="size-6 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">3</span>
                <span>Collez cette référence dans le formulaire ci-dessous et envoyez.</span>
              </li>
              <li className="flex gap-3">
                <span className="size-6 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">4</span>
                <span>Notre équipe vérifie le paiement (sous 24h) et crédite vos jetons.</span>
              </li>
            </ol>
          </div>

          {/* Instructions admin */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {instructions}
          </div>

          <fieldset>
            <legend className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
              Méthode de paiement
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "mvola", label: "Mvola" },
                { v: "orange_money", label: "Orange Money" },
                { v: "airtel_money", label: "Airtel Money" },
              ].map((m) => (
                <button
                  key={m.v}
                  type="button"
                  onClick={() => setMethod(m.v)}
                  className={`min-h-12 py-3 px-2 rounded-lg border text-sm font-semibold ${
                    method === m.v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="reference"
              className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground"
            >
              Référence de transaction *
            </label>
            <input
              id="reference"
              name="reference"
              type="text"
              required
              minLength={4}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: MX2349821"
              disabled={pending}
              className="mt-1.5 w-full min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Copiez la référence reçue après votre paiement Mvola/OM/Airtel.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              disabled={pending}
              className="flex-1 min-h-12 py-3 bg-card border border-border rounded-lg font-semibold text-sm uppercase tracking-wider hover:bg-muted disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-[2] min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Envoi…" : "Envoyer la demande"}
            </button>
          </div>
        </form>
      )}

      {/* Historique */}
      <section>
        <h2 className="font-display text-xl italic mb-4">Mes achats récents</h2>
        {purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-2xl">
            Aucun achat pour le moment.
          </p>
        ) : (
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <PurchaseStatus status={p.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {p.pack_size} jeton{p.pack_size > 1 ? "s" : ""} —{" "}
                    <span className="font-mono">{formatAr(p.amount_ar)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    Réf: {p.payment_reference}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0 text-right">
                  {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PurchaseStatus({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span
        title="Validé"
        className="size-7 grid place-items-center rounded-full bg-verified/20 text-verified"
      >
        <Check className="size-3.5" />
      </span>
    );
  if (status === "rejected")
    return (
      <span
        title="Refusé"
        className="size-7 grid place-items-center rounded-full bg-destructive/20 text-destructive"
      >
        <X className="size-3.5" />
      </span>
    );
  return (
    <span
      title="En attente"
      className="size-7 grid place-items-center rounded-full bg-premium/20 text-premium-foreground"
    >
      <Clock className="size-3.5" />
    </span>
  );
}
