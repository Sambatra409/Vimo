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
  inappropriate: "Contenu inapproprie",
  illegal: "Activite illegale",
  phone_contact: "Tentative de contournement",
  other: "Autre",
};

export async function getReportCategoryLabel(cat: ReportCategory): Promise<string> {
  return CATEGORY_LABELS[cat] ?? cat;
}

export async function reportPropertyAction(propertyId: string, category: ReportCategory, message: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!propertyId) return { ok: false, error: "Annonce invalide." };
  if (!category) return { ok: false, error: "Choisissez un motif." };
  if (!message || message.trim().length < 10) return { ok: false, error: "Decrivez le probleme (10 caracteres minimum)." };
  if (message.length > 1000) return { ok: false, error: "Message trop long (1000 caracteres max)." };
  const check = checkForbiddenContent(message);
  if (!check.ok) return { ok: false, error: "Votre message contient une suite de chiffres. N'incluez pas de coordonnees." };
  const admin = createAdminClient();
  const { data: property } = await admin.from("properties").select("id, owner_id, title").eq("id", propertyId).single();
  if (!property) return { ok: false, error: "Annonce introuvable." };
  if (property.owner_id === user.id) return { ok: false, error: "Vous ne pouvez pas signaler votre propre annonce." };
  const { data: existing } = await admin.from("reports").select("id").eq("reporter_id", user.id).eq("property_id", propertyId).eq("status", "pending").maybeSingle();
  if (existing) return { ok: false, error: "Vous avez deja signale cette annonce." };
  const { error } = await admin.from("reports").insert({ property_id: propertyId, reporter_id: user.id, category, message: message.trim() });
  if (error) { console.error("[reportProperty] insert error:", error); return { ok: false, error: "Erreur technique, reessayez." }; }
  revalidatePath(`/property/${propertyId}`);
  return { ok: true };
}

export async function listReportsAdmin() {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data: reports } = await admin.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
  if (!reports || reports.length === 0) return [];
  const propertyIds = Array.from(new Set(reports.map((r: any) => r.property_id)));
  const reporterIds = Array.from(new Set(reports.map((r: any) => r.reporter_id)));
  const [propsRes, profsRes] = await Promise.all([
    admin.from("properties").select("id, title, city, owner_id, status").in("id", propertyIds),
    admin.from("profiles").select("id, full_name, email").in("id", reporterIds),
  ]);
  const propsMap = new Map((propsRes.data ?? []).map((p: any) => [p.id, p]));
  const profsMap = new Map((profsRes.data ?? []).map((p: any) => [p.id, p]));
  return reports.map((r: any) => ({
    ...r,
    category_label: CATEGORY_LABELS[r.category as ReportCategory] ?? r.category,
    property: propsMap.get(r.property_id) ?? null,
    reporter: profsMap.get(r.reporter_id) ?? null,
  }));
}

export async function resolveReportAction(reportId: string, action: "dismiss" | "pause_property" | "delete_property" | "ban_owner", adminNote: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireRole("admin");
  const admin = createAdminClient();
  const { data: report } = await admin.from("reports").select("*").eq("id", reportId).single();
  if (!report) return { ok: false, error: "Signalement introuvable." };
  if (report.status !== "pending") return { ok: false, error: "Deja traite." };
  if (action === "pause_property") {
    await admin.from("properties").update({ status: "paused" }).eq("id", report.property_id);
  } else if (action === "delete_property") {
    await admin.from("properties").delete().eq("id", report.property_id);
  } else if (action === "ban_owner") {
    const { data: prop } = await admin.from("properties").select("owner_id").eq("id", report.property_id).single();
    if (prop) {
      await admin.from("profiles").update({ is_banned: true, ban_reason: `Signalement: ${adminNote || "fraude"}` }).eq("id", prop.owner_id);
      await admin.from("properties").update({ status: "paused" }).eq("owner_id", prop.owner_id);
    }
  }
  await admin.from("reports").update({
    status: action === "dismiss" ? "dismissed" : "reviewed",
    admin_note: adminNote || null,
    reviewed_by: me.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", reportId);
  revalidatePath("/dashboard/admin/reports");
  revalidatePath("/", "layout");
  return { ok: true };
}
