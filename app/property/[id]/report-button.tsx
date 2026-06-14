"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";
import {
  reportPropertyAction,
  type ReportCategory,
} from "@/lib/actions/reports";

const CATEGORIES: { value: ReportCategory; label: string; description: string }[] = [
  { value: "fake", label: "Annonce fictive", description: "Le bien n'existe pas ou est faux" },
  { value: "fraud", label: "Arnaque / Escroquerie", description: "Demande de paiement avant visite, etc." },
  { value: "phone_contact", label: "Coordonnées cachées", description: "Numéro visible dans la photo, le titre, etc." },
  { value: "duplicate", label: "Annonce en double", description: "Déjà publiée par quelqu'un d'autre" },
  { value: "inappropriate", label: "Contenu inapproprié", description: "Photos choquantes, propos déplacés..." },
  { value: "illegal", label: "Activité illégale", description: "Bien non autorisé, etc." },
  { value: "other", label: "Autre", description: "Précisez dans le message" },
];

export function ReportButton({
  propertyId,
  isLoggedIn,
}: {
  propertyId: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <a
        href={`/login?redirect=/property/${propertyId}`}
        className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-4 py-3 bg-card border border-border rounded-lg text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
      >
        <Flag className="size-3.5" />
        Signaler cette annonce
      </a>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error("Choisissez un motif.");
      return;
    }
    startTransition(async () => {
      const res = await reportPropertyAction(propertyId, category as ReportCategory, message);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Signalement envoyé. Merci pour votre vigilance.");
      setOpen(false);
      setCategory("");
      setMessage("");
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-4 py-3 bg-card border border-border rounded-lg text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
      >
        <Flag className="size-3.5" />
        Signaler cette annonce
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between">
              <h3 className="font-display text-xl italic">Signaler l'annonce</h3>
              <button
                onClick={() => setOpen(false)}
                className="size-8 grid place-items-center rounded-full hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Motif du signalement
                </label>
                <div className="space-y-2">
                  {CATEGORIES.map((c) => (
                    <label
                      key={c.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        category === c.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={c.value}
                        checked={category === c.value}
                        onChange={() => setCategory(c.value)}
                        className="mt-1 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="report-message"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block"
                >
                  Décrivez le problème
                </label>
                <textarea
                  id="report-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  placeholder="Expliquez précisément ce qui pose problème..."
                  disabled={pending}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  ⚠️ N'incluez aucun numéro de téléphone ni email dans ce message.{" "}
                  {message.length}/1000
                </p>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full min-h-12 py-3 bg-destructive text-destructive-foreground rounded-lg font-semibold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Envoi..." : "Envoyer le signalement"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
