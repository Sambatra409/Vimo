"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email et mot de passe requis." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: "Email ou mot de passe incorrect." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_banned, ban_reason")
    .eq("id", data.user.id)
    .single();

  if (profile?.is_banned) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: `Votre compte a été suspendu. Motif : ${profile.ban_reason || "Violation des CGU"}.`,
    };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "locataire").trim();

  if (!email || !password || !fullName) {
    return { ok: false, error: "Tous les champs obligatoires doivent être remplis." };
  }

  if (password.length < 6) {
    return { ok: false, error: "Le mot de passe doit faire au moins 6 caractères." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vohitra-imo.com";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
      data: { full_name: fullName, phone: phone || null, role },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { ok: false, error: "Un compte existe déjà avec cet email." };
    }
    return { ok: false, error: error.message };
  }

  if (!data.user) {
    return { ok: false, error: "Erreur lors de la création du compte." };
  }

  const admin = createAdminClient();
  await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    email,
    phone: phone || null,
    roles: [role],
    tokens_balance: 0,
  });

  return { ok: true, needsConfirmation: !data.session };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { ok: false, error: "Email requis." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vohitra-imo.com";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("[forgotPassword] error:", error);
    return { ok: false, error: "Erreur lors de l'envoi." };
  }

  return {
    ok: true,
    message: "Si un compte existe pour cet email, un lien a été envoyé.",
  };
}

export async function updatePasswordAction(formData: FormData) {
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: "Le mot de passe doit faire au moins 6 caractères." };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Les mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session expirée. Refaites une demande de réinitialisation." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("[updatePassword] error:", error);
    return { ok: false, error: "Erreur lors de la mise à jour." };
  }


  // Alias pour compatibilité avec l'ancienne page reset-password
export const resetPasswordAction = updatePasswordAction;
  return { ok: true };
}
