import { checkPassword, createSessionToken, SESSION_COOKIE, SESSION_DURATION_S } from "@/server/auth";
import { errorResponse, json, readJson, str } from "@/server/http";

export const dynamic = "force-dynamic";

// Limitation simple des tentatives (en mémoire, par adresse IP).
const attempts = new Map<string, { count: number; until: number }>();

export async function POST(request: Request) {
  try {
    if (!process.env.FOUNDER_PASSWORD) {
      return json({ error: "La connexion n'est pas configurée (FOUNDER_PASSWORD absent)." }, 400);
    }
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const entry = attempts.get(ip);
    if (entry && entry.count >= 5 && entry.until > Date.now()) {
      return json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);
    }
    const body = await readJson(request, 2000);
    const ok = await checkPassword(str(body, "password", { required: true, max: 200 })!);
    if (!ok) {
      attempts.set(ip, { count: (entry?.count ?? 0) + 1, until: Date.now() + 10 * 60_000 });
      return json({ error: "Mot de passe incorrect." }, 401);
    }
    attempts.delete(ip);
    const token = await createSessionToken();
    const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "content-type": "application/json",
        "set-cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_S}${secure ? "; Secure" : ""}`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
