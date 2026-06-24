"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Composant universel qui détecte si l'URL contient un token de recovery
 * (mot de passe oublié) et redirige automatiquement vers /reset-password.
 */
export function AuthRecoveryListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Ne rien faire si on est déjà sur /reset-password
    if (pathname === "/reset-password") return;

    // Vérifier le fragment d'URL (#access_token=...&type=recovery)
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      router.push("/reset-password" + hash);
      return;
    }

    // Vérifier les query params (?code=... pour PKCE)
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const type = params.get("type");

    if (code && (type === "recovery" || !type)) {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          router.push("/reset-password");
        }
      });
    }

    // Supabase déclenche aussi un événement PASSWORD_RECOVERY
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY" && pathname !== "/reset-password") {
          router.push("/reset-password");
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  return null;
}
