import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // === VÉRIFICATION BANNISSEMENT ===
  // Si l'utilisateur est connecté, on vérifie qu'il n'est pas banni
  if (user) {
    try {
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=is_banned`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          cache: "no-store",
        },
      );
      if (profileRes.ok) {
        const profiles = await profileRes.json();
        if (profiles[0]?.is_banned) {
          // Banni → déconnexion forcée + redirect /banned
          await supabase.auth.signOut();
          if (request.nextUrl.pathname !== "/banned") {
            const url = request.nextUrl.clone();
            url.pathname = "/banned";
            url.search = "";
            return NextResponse.redirect(url);
          }
        }
      }
    } catch (e) {
      // En cas d'erreur, on laisse passer (failsafe)
      console.error("[middleware] ban check error:", e);
    }
  }

  const protectedPaths = [
    "/dashboard",
    "/favorites",
    "/alerts",
    "/history",
    "/messages",
    "/tokens",
    "/kyc",
    "/property/new",
  ];

  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const authPaths = ["/login", "/signup"];
  const isAuthPage =
    authPaths.includes(request.nextUrl.pathname) ||
    (request.nextUrl.pathname.startsWith("/signup/") &&
      request.nextUrl.pathname !== "/signup/confirm");

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}
