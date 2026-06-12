import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase utilisé UNIQUEMENT côté navigateur.
 *
 * - Utilise la clé anon (publishable) — c'est OK car elle a peu de pouvoir,
 *   et toutes nos tables ont RLS activé sans policy permissive.
 * - À utiliser pour les listeners realtime côté client (messages, notifications)
 *   et pour la déconnexion. Sinon : passe par Server Actions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
