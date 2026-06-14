"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, requireRole } from "@/lib/auth";
import { checkForbiddenContent } from "@/lib/forbidden-content";

export type ReportCategory =
  | "fake"
  | "fraud"
  | "duplicate"
  | "inappropriate"
  | "illegal"
  | "phone_contact"
  | "other";

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  fake: "Annonce fictive / fausse",
  fraud: "Arnaque / escroquerie",
  duplicate: "Annonce en double",
  inappropriate: "Contenu inapproprié",
  illegal: "Activité illégale",
  phone_contact: "Tentative de contournement (numéro dans l'annonce)",
  other: "Autre",
};

export async function getReportCategoryLabel(cat: ReportCategory): Promise<string> {
  return CATEGORY_LABELS[cat] ?? cat;
}

// ============================================================================
// SIGNALER UNE ANNONCE (locataire / visiteur connecté)
// ============================================================================
export async function reportPropertyAction(
  propertyId: string,
  category: ReportCategory,
  message: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  if (!propertyId) return { ok: false, error: "Annonce invalide." };
  if (!category) return { ok: false, error: "Choisissez un motif." };
  if (!message || message.trim().length < 10)
    return { ok: false, error: "Décrivez le problème (10 caractères minimum)." };
  if (message.length > 1000)
    return { ok: false, error:
