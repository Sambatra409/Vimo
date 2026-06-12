"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import type { Alert, AlertFrequency, SearchFilters } from "@/lib/types";

export async function createAlertAction(formData: FormData): Promise<
  { ok: true; alert: Alert } | { ok: false; error: string }
> {
  const user = await requireUser();
  const admin = createAdminClient();

  const name = String(formData.get("name") ?? "").trim();
  const frequency = String(formData.get("frequency") ?? "daily") as AlertFrequency;

  if (!name || name.length < 3)
    return { ok: false, error: "Nom requis (3 caractères min)." };
  if (!["instant", "daily", "weekly"].includes(frequency))
    return { ok: false, error: "Fréquence invalide." };

  // Parser les filtres depuis le formulaire
  const filters: SearchFilters = {};
  const city = String(formData.get("city") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const listing = String(formData.get("listing") ?? "");
  const pmax = Number(formData.get("pmax")) || 0;
  const pmin = Number(formData.get("pmin")) || 0;
  const smin = Number(formData.get("smin")) || 0;
  const rooms = Number(formData.get("rooms")) || 0;

  if (city) filters.city = city;
  if (type) filters.type = type as any;
  if (listing) filters.listing = listing as any;
  if (pmin) filters.pmin = pmin;
  if (pmax) filters.pmax = pmax;
  if (smin) filters.smin = smin;
  if (rooms) filters.rooms = rooms;

  // Anti-spam : max 10 alertes par user
  const { count } = await admin
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= 10)
    return { ok: false, error: "Maximum 10 alertes par compte." };

  const { data, error } = await admin
    .from("alerts")
    .insert({ user_id: user.id, name, filters, frequency, is_active: true })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[createAlert]", error);
    return { ok: false, error: "Erreur lors de la création." };
  }

  revalidatePath("/alerts");
  return { ok: true, alert: data as Alert };
}

export async function listAlerts(): Promise<Alert[]> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []) as Alert[];
}

export async function deleteAlertAction(
  alertId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const admin = createAdminClient();

  await admin.from("alerts").delete().eq("id", alertId).eq("user_id", user.id);
  revalidatePath("/alerts");
  return { ok: true };
}

export async function toggleAlertAction(
  alertId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: cur } = await admin
    .from("alerts")
    .select("is_active")
    .eq("id", alertId)
    .eq("user_id", user.id)
    .single();
  if (!cur) return { ok: false, error: "Alerte introuvable." };

  await admin
    .from("alerts")
    .update({ is_active: !cur.is_active })
    .eq("id", alertId)
    .eq("user_id", user.id);
  revalidatePath("/alerts");
  return { ok: true };
}
