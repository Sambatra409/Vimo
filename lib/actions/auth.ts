"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  ok: boolean;
  error?: string;
}

// ----------------------------------------------------------------------------
// SIGNUP
// ----------------------------------------------------------------------------
export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "locataire");
  const acceptCgu = formData.get("acceptCgu") === "on";

  // Validation côté serveur (ne JAMAIS faire confiance au client)
  if (!fullName || fullName.length < 2) {
    return { ok: false, error: "Le nom complet est requis." };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Email invalide." };
  }
  if (!password || password.length < 6) {
    return { ok: false, error: "Le mot de passe doit faire au moins 6 caractères." };
  }
  if (!["locataire", "proprietaire"].includes(role)) {
    return { ok: false, error: "Rôle invalide." };
  }
  if (!acceptCgu) {
    return { ok: false, error: "Vous devez accepter les CGU." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Important : ces données passent dans le trigger handle_new_user()
      // qui les transfère dans profiles + user_roles
      data: {
        full_name: fullName,
        phone: phone || null,
        role,
        cgu_accepted_at: new Date().toISOString(),
      },
    },
  });

  if (error) {
    return { ok: false, error: traduireErreur(error.message) };
  }

  return { ok: true };
}

// ----------------------------------------------------------------------------
// SIGN IN
// ----------------------------------------------------------------------------
export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email et mot de passe requis." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: traduireErreur(error.message) };
  }

  // Vérifier que l'utilisateur n'est pas banni
  if (data.user) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_banned")
      .eq("id", data.user.id)
      .single();

    if (profile?.is_banned) {
      // Déconnexion immédiate
      await supabase.auth.signOut();
      return {
        ok: false,
        error: "Votre compte est suspendu. Contactez le support pour plus d'informations.",
      };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// SIGN OUT
// ----------------------------------------------------------------------------
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ----------------------------------------------------------------------------
// FORGOT PASSWORD (envoie un email avec lien de réinitialisation)
// ----------------------------------------------------------------------------
export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { ok: false, error: "Email invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") +
      "/auth/callback?next=/reset-password",
  });

  // On retourne toujours OK même si l'email n'existe pas (anti-enumération)
  if (error) {
    console.error("[forgotPassword]", error.message);
  }
  return { ok: true };
}

// ----------------------------------------------------------------------------
// RESET PASSWORD (après avoir cliqué sur le lien dans l'email)
// ----------------------------------------------------------------------------
export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");

  if (!password || password.length < 6) {
    return { ok: false, error: "Le mot de passe doit faire au moins 6 caractères." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { ok: false, error: traduireErreur(error.message) };
  }

  return { ok: true };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function traduireErreur(msg: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect.",
    "User already registered": "Un compte existe déjà avec cet email.",
    "Email rate limit exceeded": "Trop de tentatives. Réessayez dans quelques minutes.",
    "Password should be at least 6 characters":
      "Le mot de passe doit faire au moins 6 caractères.",
  };
  return map[msg] ?? msg;
}
