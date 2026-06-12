import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase utilisé dans les Server Components et Server Actions.
 *
 * - Utilise la clé anon mais avec les cookies de session de l'utilisateur
 * - Permet de récupérer l'utilisateur courant (auth) et de faire des requêtes
 *   en son nom (qui passeront par RLS — bloquées sans policy)
 * - Pour bypass RLS et faire des actions privilégiées : utiliser createAdminClient()
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Le set échoue dans les Server Components (read-only).
            // Pas grave : le middleware s'occupe du refresh.
          }
        },
      },
    },
  );
}
