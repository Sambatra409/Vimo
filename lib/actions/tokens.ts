"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import type { TokenPack, TokenPurchase } from "@/lib/types";

/**
 * Récupère les packs depuis la DB (admin peut les modifier dans /dashboard/admin/settings).
 */
export async function listActivePacks(): Promise<TokenPack[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("token_packs")
    .select("size, price_ar, label, badge")
    .eq("is_active", true)
    .order("display_order");
  return (data ?? []) as TokenPack[];
}

export async function createTokenPurchaseAction(formData: FormData): Promise<
  | { ok: true; purchase: { id: string; pack_size: number } }
  | { ok: false; error: string }
> {
  const user = await requireUser();
  const admin = createAdminClient();

  const packSize = Number(formData.get("packSize"));
  const reference = String(formData.get("reference") ?? "").trim();
  const method = String(formData.get("method") ?? "mvola");

  // Récupérer le pack en DB (le prix peut avoir été modifié par l'admin)
  const { data: pack } = await admin
    .from("token_packs")
    .select("size, price_ar")
    .eq("size", packSize)
    .eq("is_active", true)
    .single();
  if (!pack) return { ok: false, error: "Pack invalide ou désactivé." };

  if (!reference || reference.length < 4)
    return { ok: false, error: "Référence de transaction requise (4 caractères min)." };
  if (!["mvola", "orange_money", "airtel_money"].includes(method))
    return { ok: false, error: "Méthode de paiement invalide." };

  // Anti-spam : pas plus d'1 demande pending par 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("token_purchases")
    .select("id, status")
    .eq("user_id", user.id)
    .gte("created_at", yesterday);

  const hasPending = (recent ?? []).some((p: any) => p.status === "pending");
  if (hasPending) {
    return {
      ok: false,
      error: "Vous avez déjà une demande en attente. Attendez sa validation.",
    };
  }

  const { data, error } = await admin
    .from("token_purchases")
    .insert({
      user_id: user.id,
      pack_size: pack.size,
      amount_ar: pack.price_ar,
      payment_reference: reference,
      payment_method: method,
      status: "pending",
    })
    .select("id, pack_size")
    .single();

  if (error || !data) {
    console.error("[createTokenPurchase]", error);
    return { ok: false, error: "Erreur lors de la création." };
  }

  revalidatePath("/tokens");
  revalidatePath("/dashboard/admin");
  return { ok: true, purchase: data };
}

export async function listMyPurchases(): Promise<TokenPurchase[]> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from("token_purchases")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as TokenPurchase[];
}
