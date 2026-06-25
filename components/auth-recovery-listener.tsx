"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Composant universel : détecte les tokens Supabase dans l'URL et redirige
 * automatiquement vers la bonne page selon le type :
 * - type=recovery → /reset-password (mot de passe oublié)
 * - type=signup → /dashboard (confirmation d'inscription)
 * - type=invite → /dashboard (invitation)
 * - autre → reste sur place
 */
export function AuthAutoRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Ne pas rediriger si on est déjà sur les pages de destination
    if (
      pathname === "/reset-password" ||
      pathname === "/dashboard" ||
      pathname?.startsWith("/dashboard/")
    ) return;

    try {
      const hash = window.location.hash || "";
      const search = window.location.search || "";

      // Cas 1 : token dans le hash (#access_token=...&type=recovery)
      if (hash.includes("access_token")) {
        // Parse le type depuis le hash
        const hashParams = new URLSearchParams(hash.substring(1));
        const type = hashParams.get("type");

        if (type === "recovery") {
          router.replace("/reset-password" + hash);
          return;
        }
        if (type === "signup" || type === "invite" || type === "magiclink") {
          router.replace("/dashboard" + hash);
          return;
        }
      }

      // Cas 2 : code PKCE dans les query params (?code=...)
      const params = new URLSearchParams(search);
      const code = params.get("code");
      const type = params.get("type");

      if (code) {
        if (type === "recovery") {
          router.replace("/reset-password" + search);
          return;
        }
        if (type === "signup" || type === "invite") {
          router.replace("/dashboard" + search);
          return;
        }
        // Code sans type spécifié : on suppose recovery par défaut
        // (Supabase n'envoie pas toujours le type avec PKCE)
        if (!type) {
          router.replace("/reset-password" + search);
          return;
        }
      }
    } catch (e) {
      // Échec silencieux pour ne jamais planter le site
      console.warn("[AuthAutoRedirect] erreur:", e);
    }
  }, [router, pathname]);

  return null;
}

// Alias pour ne pas casser l'import existant dans layout.tsx
export const AuthRecoveryListener = AuthAutoRedirect;
