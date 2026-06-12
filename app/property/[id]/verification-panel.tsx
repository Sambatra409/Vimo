"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock, X, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  requestVerificationAction,
  cancelVerificationAction,
} from "@/lib/actions/verifications";

interface Props {
  propertyId: string;
  isVerified: boolean;
  verificationCost: number;
  isFreeMode: boolean;
  userTokens: number;
  lastRequest: {
    status: "pending" | "approved" | "rejected" | "cancelled";
    admin_note: string | null;
    created_at: string;
  } | null;
}

export function VerificationPanel({
  propertyId,
  isVerified,
  verificationCost,
  isFreeMode,
  userTokens,
  lastRequest,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  // 1. Annonce DÉJÀ vérifiée → affichage de fierté
  if (isVerified) {
    return (
      <div className="bg-verified/10 border border-verified/30 rounded-2xl p-5 md:p-6 text-center">
        <div className="size-12 mx-auto rounded-full bg-verified text-verified-foreground grid place-items-center mb-3">
          <BadgeCheck className="size-6" />
        </div>
        <h3 className="font-semibold text-verified mb-1">Annonce vérifiée</h3>
        <p className="text-xs text-muted-foreground">
          Notre équipe a contrôlé cette annonce sur place. Les locataires lui font davantage confiance.
        </p>
      </div>
    );
  }

  // 2. Demande PENDING
  if (lastRequest?.status === "pending") {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-8 rounded-full bg-premium/30 text-premium-foreground grid place-items-center">
            <Clock className="size-4" />
          </div>
          <h3 className="font-semibold text-sm">Vérification en cours</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Notre équipe va vous contacter dans les prochains jours pour convenir d'une visite sur place
          et vérifier l'annonce. Une fois validée, vous obtiendrez le badge ✓ vert.
        </p>
        <p className="text-[10px] text-muted-foreground mb-4">
          Demande envoyée le{" "}
          {new Date(lastRequest.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("Annuler la demande de vérification ? Vos jetons seront remboursés.")) return;
            startTransition(async () => {
              const res = await cancelVerificationAction(propertyId);
              if (!res.ok) toast.error(res.error);
              else {
                toast.success("Demande annulée, jetons remboursés");
                router.refresh();
              }
            });
          }}
          className="w-full min-h-10 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-destructive border border-border rounded-lg disabled:opacity-50"
        >
          Annuler la demande
        </button>
      </div>
    );
  }

  // 3. Refus précédent
  if (lastRequest?.status === "rejected") {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-8 rounded-full bg-destructive/15 text-destructive grid place-items-center">
            <X className="size-4" />
          </div>
          <h3 className="font-semibold text-sm">Vérification refusée</h3>
        </div>
        {lastRequest.admin_note && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground/80 italic mb-4">
            « {lastRequest.admin_note} »
          </div>
        )}
        <p className="text-xs text-muted-foreground mb-4">
          Les jetons utilisés ont été remboursés. Corrigez les points soulevés puis refaites une demande.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full min-h-10 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Refaire une demande
        </button>
        {showForm && (
          <VerificationForm
            propertyId={propertyId}
            verificationCost={verificationCost}
            isFreeMode={isFreeMode}
            userTokens={userTokens}
            message={message}
            setMessage={setMessage}
            pending={pending}
            startTransition={startTransition}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    );
  }

  // 4. Pas encore de demande → bouton initial
  if (!showForm) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
        <div className="size-10 mx-auto rounded-full bg-verified/15 text-verified grid place-items-center mb-3">
          <Shield className="size-5" />
        </div>
        <h3 className="text-center font-semibold mb-1">Faire vérifier mon annonce</h3>
        <p className="text-center text-xs text-muted-foreground mb-4 leading-relaxed">
          Notre équipe se rend sur place pour vérifier les informations.
          Vous obtenez un badge <strong className="text-verified">✓ vert</strong> qui rassure les locataires
          et booste vos déblocages.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full min-h-12 py-3 bg-verified text-verified-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90"
        >
          {isFreeMode
            ? "Demander gratuitement"
            : `Demander pour ${verificationCost} jeton${verificationCost > 1 ? "s" : ""}`}
        </button>
        {isFreeMode && (
          <p className="text-center text-[10px] uppercase tracking-widest font-bold text-verified mt-3">
            ✨ Mode promotionnel — gratuit
          </p>
        )}
      </div>
    );
  }

  // 5. Formulaire affiché
  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
      <h3 className="font-semibold mb-3">Demande de vérification</h3>
      <VerificationForm
        propertyId={propertyId}
        verificationCost={verificationCost}
        isFreeMode={isFreeMode}
        userTokens={userTokens}
        message={message}
        setMessage={setMessage}
        pending={pending}
        startTransition={startTransition}
        onCancel={() => setShowForm(false)}
      />
    </div>
  );
}

function VerificationForm({
  propertyId,
  verificationCost,
  isFreeMode,
  userTokens,
  message,
  setMessage,
  pending,
  startTransition,
  onCancel,
}: {
  propertyId: string;
  verificationCost: number;
  isFreeMode: boolean;
  userTokens: number;
  message: string;
  setMessage: (v: string) => void;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const cost = isFreeMode ? 0 : verificationCost;
  const canAfford = isFreeMode || userTokens >= cost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await requestVerificationAction(propertyId, message);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        "Demande envoyée. Notre équipe vous contactera prochainement 🎉",
        { duration: 6000 },
      );
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground/80 leading-relaxed">
        <p className="mb-2 font-semibold text-foreground">
          📞 Comment ça se passe :
        </p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Votre demande est envoyée à notre équipe</li>
          <li>Un membre vous appelle pour fixer un rendez-vous (sous 2-3 jours)</li>
          <li>Visite sur place pour vérifier l'annonce</li>
          <li>Validation → votre annonce obtient le badge <strong className="text-verified">✓ vert</strong></li>
        </ol>
        <p className="mt-2 text-muted-foreground">
          En cas de refus, vos jetons sont intégralement remboursés.
        </p>
      </div>

      <div>
        <label
          htmlFor="vmsg"
          className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 inline-block"
        >
          Message à notre équipe (optionnel)
        </label>
        <textarea
          id="vmsg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Disponibilités, étage, code d'accès, particularités…"
          disabled={pending}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {!isFreeMode && (
        <div className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-muted-foreground">Coût :</span>
          <span className="font-mono font-semibold">
            {cost} jeton{cost > 1 ? "s" : ""}
            <span className="text-muted-foreground font-sans font-normal ml-1">
              (vous avez {userTokens})
            </span>
          </span>
        </div>
      )}

      {!canAfford && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-3 py-2 text-xs">
          Solde insuffisant.{" "}
          <a href="/tokens" className="underline font-semibold">
            Acheter des jetons →
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 min-h-12 py-3 text-xs font-semibold uppercase tracking-wider border border-border rounded-lg hover:bg-muted disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending || !canAfford}
          className="flex-[2] min-h-12 py-3 bg-verified text-verified-foreground rounded-lg font-semibold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
        >
          {pending
            ? "Envoi…"
            : isFreeMode
              ? "Envoyer la demande gratuitement"
              : `Envoyer pour ${cost} jeton${cost > 1 ? "s" : ""}`}
        </button>
      </div>
    </form>
  );
}
