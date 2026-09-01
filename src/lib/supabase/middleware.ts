import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectAuthCodeFromLogin(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname !== "/login") return null;

  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (!code && !tokenHash) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/auth/callback";
  if (!url.searchParams.has("next")) {
    url.searchParams.set("next", "/auth/reset-password");
  }
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const authCodeRedirect = redirectAuthCodeFromLogin(request);
  if (authCodeRedirect) return authCodeRedirect;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage =
    path === "/login" ||
    path === "/signup" ||
    path === "/forgot-password";
  const isProtected =
    path.startsWith("/boards") || path === "/" || path.startsWith("/auth");

  const requiresAuth = path.startsWith("/boards") || path.startsWith("/profile");

  if (!user && requiresAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/boards";
    return NextResponse.redirect(url);
  }

  if (!user && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/boards";
    return NextResponse.redirect(url);
  }

  void isProtected;
  return supabaseResponse;
}
