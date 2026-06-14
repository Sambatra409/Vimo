"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Mail, Lock, Unlock, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { unlockContactAction } from "@/lib/actions/properties";
import type { OwnerContact } from "@/lib/types";

interface Props {
  propertyId: string;
  ownerId: string;
  initialUnlocked: boolean;
  isLoggedIn: boolean;
  isFreeMode: boolean;
  unlockCost: number;
  contactPhone1: string | null;
  contactPhone2: string | null;
}

export function ContactPanel({
  propertyId,
  ownerId,
  initialUnlocked,
  isLoggedIn,
  isFreeMode,
  unlockCost,
  contactPhone1,
  contactPhone2,
}: Props) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [owner, setOwner] = useState<OwnerContact | null>(null);
  const [pending, startTransition] = useTransition();

  // Pas connecté : invitation à se connecter
  if (!isLoggedIn) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
        <div className="size-10 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center mb-3">
          <Lock className="size-5" />
        </div>
        <h3 className="text-center font-semibold mb-1">
          Connectez-vous pour voir le contact
        </h3>
        <p className="text-center text-xs text-muted-foreground mb-4">
          Un compte est nécessaire pour débloquer les coordonnées du propriétaire.
        </p>
        <Link
          href={`/login?redirect=/property/${propertyId}`}
          className="block w-full text-center min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Se connecter
        </Link>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Pas de compte ?{" "}
          <Link
            href={`/signup?redirect=/property/${propertyId}`}
            className="text-primary font-semibold hover:underline"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    );
  }

  // Déjà débloqué OU vient de débloquer
  if (unlocked && owner === null) {
    // L'utilisateur a déjà débloqué mais on n'a pas encore les coordonnées
    // → bouton "Voir les coordonnées" qui les fetch
    return (
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
        <div className="size-10 mx-auto rounded-full bg-verified/15 text-verified grid place-items-center mb-3">
          <Unlock className="size-5" />
        </div>
        <h3 className="text-center font-semibold mb-1">Contact débloqué</h3>
        <p className="text-center text-xs text-muted-foreground mb-4">
          Vous avez déjà débloqué cette annonce.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await unlockContactAction(propertyId);
              if (res.ok) setOwner(res.owner);
              else toast.error(res.error);
            })
          }
          className="w-full min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Chargement…" : "Voir les coordonnées"}
        </button>
      </div>
    );
  }

  // Coordonnées affichées
  if (owner) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-8 rounded-full bg-verified/15 text-verified grid place-items-center">
            <Unlock className="size-4" />
          </div>
          <h3 className="font-semibold text-sm">Contact débloqué</h3>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3">
            <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Propriétaire
              </p>
              <p className="text-sm font-medium truncate">{owner.full_name}</p>
            </div>
          </div>
          {contactPhone1 && (
            <div className="flex items-start gap-3">
              <Phone className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Téléphone principal
                </p>
                <a
                  href={`tel:${contactPhone1.replace(/\s/g, "")}`}
                  className="text-sm font-medium font-mono hover:text-primary"
                >
                  {contactPhone1}
                </a>
              </div>
            </div>
          )}
          {contactPhone2 && (
            <div className="flex items-start gap-3">
              <Phone className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Téléphone secondaire
                </p>
                <a
                  href={`tel:${contactPhone2.replace(/\s/g, "")}`}
                  className="text-sm font-medium font-mono hover:text-primary"
                >
                  {contactPhone2}
                </a>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Mail className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Email
              </p>
              <a
                href={`mailto:${owner.email}`}
                className="text-sm font-medium hover:text-primary truncate block"
              >
                {owner.email}
              </a>
            </div>
          </div>
        </div>

        <Link
          href={`/messages/${propertyId}/${ownerId}`}
          className="w-full min-h-12 py-3 bg-foreground text-background rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <MessageSquare className="size-4" />
          Envoyer un message
        </Link>
      </div>
    );
  }

  // Cas par défaut : bouton "Débloquer"
  const handleUnlock = () => {
    startTransition(async () => {
      const res = await unlockContactAction(propertyId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setUnlocked(true);
      setOwner(res.owner);
      toast.success(
        res.alreadyUnlocked
          ? "Coordonnées récupérées"
          : isFreeMode
            ? "Contact débloqué gratuitement (mode promotionnel) 🎉"
            : `Contact débloqué (${unlockCost} jeton${unlockCost > 1 ? "s" : ""} utilisé${unlockCost > 1 ? "s" : ""})`,
      );
      router.refresh();
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
      <div className="size-10 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center mb-3">
        <Lock className="size-5" />
      </div>
      <h3 className="text-center font-semibold mb-1">Contact verrouillé</h3>
      <p className="text-center text-xs text-muted-foreground mb-4">
        {isFreeMode
          ? "Débloquez gratuitement le téléphone et l'email du propriétaire."
          : `Coût : ${unlockCost} jeton${unlockCost > 1 ? "s" : ""} pour voir téléphone et email.`}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={handleUnlock}
        className="w-full min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
      >
        <Unlock className="size-4" />
        {pending
          ? "Déblocage…"
          : isFreeMode
            ? "Débloquer gratuitement"
            : `Débloquer pour ${unlockCost} jeton${unlockCost > 1 ? "s" : ""}`}
      </button>
      {isFreeMode && (
        <p className="text-center text-[10px] uppercase tracking-widest font-bold text-verified mt-3">
          ✨ Mode lancement — gratuit
        </p>
      )}
    </div>
  );
}
