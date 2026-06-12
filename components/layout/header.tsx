import { getCurrentUser } from "@/lib/auth";
import { HeaderClient } from "./header-client";

/**
 * Header est un Server Component : il charge l'utilisateur côté serveur
 * (sécurisé, pas exposé) et passe les infos minimales au composant client
 * qui gère l'interactivité (menu mobile, etc.).
 */
export async function Header() {
  const user = await getCurrentUser();

  // On ne passe que les données nécessaires à l'UI — pas tout l'objet user
  return (
    <HeaderClient
      user={
        user
          ? {
              full_name: user.full_name,
              tokens_balance: user.tokens_balance,
              roles: user.roles,
            }
          : null
      }
    />
  );
}
