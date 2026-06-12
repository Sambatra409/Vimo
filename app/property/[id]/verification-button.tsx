"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { requestVerificationAction } from "@/lib/actions/verification";

interface Props {
  propertyId: string;
  isVerified: boolean;
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  adminNote?: string | null;
  isFreeMode: boolean;
  verificationCost: number;
  userTokens: number;
}

export function VerificationButton({
  propertyId,
  isVerified,
  verificationStatus,
  adminNote,
  isFreeMode,
  verificationCost,
  userTokens,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ownerNote, setOwnerNote] = useState("");
  const [pending, startTransition] = useTransition();

  // 1. Déjà vérifié → afficher le badge
  if (isVerified) {
    return (
      <div className="bg-verified/10 border border-verified/30 rounded-2xl p-5 text-center">
        <div className="size-10 mx-auto mb-2 rounded-full bg-verified text-verified-foreground grid place-items-center">
          <BadgeCheck className="size-5" />
        </div>
        <p className="text-xs uppercase tracking-widest font-bold text-verified mb-1">
          Annonce vérifiée
        </p>
        <p className="text-xs text-foreground/80">
          Votre annonce porte le badge ✓ vert.
        </p>
      </div>
    );
  }

  // 2. Demande en cours
  if (verificationStatus === "pending") {
    return (
      <div className="bg-premium/15 border border-premium/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-8 rounded-full bg-premium/30 grid place-items-center">
            <Clock className="size-4 text-premium-foreground" />
          </div>
          <p className="text-xs uppercase tracking-widest font-bold text-premium-foreground">
            Vérification en cours
          </p>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">
          Notre équipe a reçu votre demande et va vous contacter sous <strong>48h</strong> pour planifier la vérification sur place.
        </p>
      </div>
    );
  }

  // 3. Demande refusée précédemment → afficher la raison + permettre de refaire
  const wasRejected = verificationStatus === "rejected";

  const handleRequest = () => {
    startTransition(async () => {
      const res = await requestVerificationAction(propertyId, ownerNote.trim() || undefined);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.isFree
          ? "Demande envoyée gratuitement 🎉"
          : `Demande envoyée (${res.cost} jetons utilisés)`,
      );
      setOpen(false);
      router.refresh();
    });
  };

  const cost = isFreeMode ? 0 : verificationCost;
  const canAfford = isFreeMode || userTokens >= cost;

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-5">
        {wasRejected && adminNote && (
          <div className="mb-3 bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs">
            <p className="font-semibold text-destructive mb-1">Demande précédente refusée</p>
            <p className="text-foreground/80 leading-relaxed">{adminNote}</p>
          </div>
        )}

        <div className="size-10 mx-auto mb-3 rounded-full bg-verified/15 text-verified grid place-items-center">
          <BadgeCheck className="size-5" />
        </div>
        <h3 className="text-center font-semibold text-sm mb-1">
          Faire vérifier mon annonce
        </h3>
        <p className="text-center text-xs text-muted-foreground mb-4 leading-relaxed">
          Notre équipe se déplace sur place pour vérifier les informations.
          {isFreeMode ? (
            <> <strong className="text-verified">Gratuit pour le moment.</strong></>
          ) : (
            <> Coût : <strong>{cost} jetons</strong>.</>
          )}
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full min-h-12 py-3 bg-verified text-verified-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
        >
          <BadgeCheck className="size-4" />
          {wasRejected ? "Refaire une demande" : "Demander la vérification"}
        </button>
      </div>

      {/* Modale de confirmation */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 grid place-items-center p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-md w-full p-5 md:p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-xl italic">Vérifier l'annonce</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Confirmez votre demande
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                aria-label="Fermer"
                className="size-8 grid place-items-center rounded-md hover:bg-muted shrink-0"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4 text-sm space-y-2">
              <p className="leading-relaxed">
                <strong>👥 Notre équipe va vous contacter</strong> sous 48h pour planifier un rendez-vous de visite à votre annonce.
              </p>
              <p className="leading-relaxed text-muted-foreground text-xs">
                Une fois la visite réalisée et les informations validées, votre annonce obtiendra le <span className="inline-flex items-center gap-1 font-semibold text-verified"><BadgeCheck className="size-3" />badge vert</span> qui rassure les locataires.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Coût
              </span>
              {isFreeMode ? (
                <span className="inline-flex items-center gap-1 font-mono text-verified font-semibold">
                  <Sparkles className="size-3" />
                  Gratuit
                </span>
              ) : (
                <span className="font-mono text-primary font-bold">
                  {cost} jeton{cost > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {!canAfford && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs text-destructive mb-4">
                Solde insuffisant. Vous avez {userTokens} jetons, il en faut {cost}.
              </div>
            )}

            <label className="block mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 inline-block">
                Message à notre équipe (optionnel)
              </span>
              <textarea
                value={ownerNote}
                onChange={(e) => setOwnerNote(e.target.value)}
                rows={3}
                maxLength={500}
                disabled={pending}
                placeholder="Heures de disponibilité, accès au bien, contact direct…"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="flex-1 min-h-12 py-3 bg-muted rounded-lg font-semibold text-sm uppercase tracking-wider hover:bg-card disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleRequest}
                disabled={pending || !canAfford}
                className="flex-[2] min-h-12 py-3 bg-verified text-verified-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Envoi…" : isFreeMode ? "Envoyer gratuitement" : `Payer ${cost} jeton${cost > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
