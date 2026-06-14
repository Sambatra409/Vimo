import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Succès → redirige vers la home (ou la page demandée)
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth callback] error:", error);
  }

  // Échec → page de login avec message
  return NextResponse.redirect(
    `${origin}/login?error=Le lien a expir%C3%A9 ou est invalide`,
  );
}
