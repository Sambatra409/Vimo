"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";

/**
 * Upload une photo dans le bucket Supabase Storage.
 * La compression et l'OCR sont faits côté client AVANT l'appel à cette action.
 */
export async function uploadPropertyPhotoAction(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await requireUser();

  const file = formData.get("file") as File | null;
  const propertyId = String(formData.get("propertyId") ?? "");

  if (!file) return { ok: false, error: "Aucun fichier reçu." };
  if (file.size > 2 * 1024 * 1024)
    return { ok: false, error: "Photo trop lourde (>2 MB)." };

  const allowed = ["image/webp", "image/jpeg", "image/png"];
  if (!allowed.includes(file.type))
    return { ok: false, error: "Format non autorisé (WebP/JPEG/PNG uniquement)." };

  const admin = createAdminClient();
  const ext = file.type.split("/")[1];
  const path = `${user.id}/${propertyId || "draft"}/${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage
    .from("properties")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

  if (error) {
    console.error("[uploadPhoto]", error);
    return { ok: false, error: "Échec de l'upload. Réessayez." };
  }

  const { data } = admin.storage.from("properties").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

export async function deletePropertyPhotoAction(
  url: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const admin = createAdminClient();

  const match = url.match(/\/properties\/(.+)$/);
  if (!match) return { ok: false, error: "URL invalide." };
  const path = match[1];

  if (!path.startsWith(`${user.id}/`))
    return { ok: false, error: "Non autorisé." };

  await admin.storage.from("properties").remove([path]);
  return { ok: true };
}
