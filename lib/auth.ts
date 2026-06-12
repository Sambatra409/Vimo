import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppRole = "locataire" | "proprietaire" | "admin";

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  tokens_balance: number;
  is_kyc_verified: boolean;
  roles: AppRole[];
}

/**
 * Récupère l'utilisateur connecté + son profile + ses rôles.
 * Retourne null si non connecté.
 *
 * À utiliser dans tous les Server Components / Actions pour vérifier l'auth.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // On utilise l'admin client pour récupérer profile + rôles
  // (RLS bloque l'accès direct, c'est volontaire)
  const admin = createAdminClient();

  const [profileRes, rolesRes] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, phone, email, tokens_balance, is_kyc_verified, is_banned")
      .eq("id", user.id)
      .single(),
    admin.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  if (profileRes.error || !profileRes.data) return null;

  // Si l'utilisateur est banni, on retourne null (équivalent à déconnecté)
  if (profileRes.data.is_banned) return null;

  return {
    id: user.id,
    email: profileRes.data.email,
    full_name: profileRes.data.full_name,
    phone: profileRes.data.phone,
    tokens_balance: profileRes.data.tokens_balance,
    is_kyc_verified: profileRes.data.is_kyc_verified,
    roles: (rolesRes.data ?? []).map((r) => r.role as AppRole),
  };
}

/**
 * Garde-fou : retourne l'utilisateur ou throw si pas connecté.
 * À utiliser dans les Server Actions qui exigent un utilisateur connecté.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized: vous devez être connecté.");
  return user;
}

/**
 * Garde-fou de rôle : retourne l'utilisateur ou throw si pas le bon rôle.
 */
export async function requireRole(role: AppRole): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.roles.includes(role)) {
    throw new Error(`Forbidden: rôle ${role} requis.`);
  }
  return user;
}
