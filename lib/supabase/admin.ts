import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * ⚠️ CLIENT ADMIN — bypass complet de RLS, à manipuler avec EXTRÊME prudence
 *
 * - Import "server-only" : Next.js plante au build si on tente de l'utiliser
 *   dans un Client Component. C'est notre garde-fou anti-fuite.
 * - Utilise la SUPABASE_SERVICE_ROLE_KEY (sans préfixe NEXT_PUBLIC_)
 * - À utiliser dans les Server Actions / Route Handlers pour les opérations
 *   privilégiées (création de compte, débit jeton, modération admin...)
 *
 * Règle d'or : TOUJOURS vérifier l'identité et les droits de l'utilisateur
 * AVANT d'utiliser ce client. Exemple :
 *
 *   const { data: { user } } = await (await createServerClient()).auth.getUser();
 *   if (!user) throw new Error("Unauthorized");
 *   const admin = createAdminClient();  // OK, on a vérifié l'auth
 *   await admin.from("profiles").update(...).eq("id", user.id);
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante. Cette clé doit vivre dans .env.local côté serveur uniquement.",
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
