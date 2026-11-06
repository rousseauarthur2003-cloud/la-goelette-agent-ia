import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth";

/**
 * Protection des pages et API de gestion.
 * - FOUNDER_PASSWORD défini : tout le site exige la connexion du fondateur,
 *   sauf la page de connexion, la santé du service et l'API des agents
 *   (protégée par son propre jeton).
 * - FOUNDER_PASSWORD absent : mode démonstration public, actions sensibles
 *   refusées par les routes API.
 */
const PUBLIC_PATHS = ["/connexion", "/api/auth/login", "/api/health", "/api/agent"];

export async function middleware(request: NextRequest) {
  if (!process.env.FOUNDER_PASSWORD) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/connexion";
  url.search = `?suite=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|assets/).*)"],
};
