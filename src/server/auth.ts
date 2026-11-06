/**
 * Session fondateur minimale : cookie signé HMAC-SHA256 (Web Crypto),
 * utilisable dans le middleware (edge) comme dans les routes API (Node).
 *
 * - Si FOUNDER_PASSWORD n'est pas défini, il n'y a pas de connexion possible :
 *   le site reste consultable en démonstration et les actions sensibles sont refusées.
 * - Le secret de signature est AUTH_SECRET (recommandé). À défaut, il est dérivé
 *   du mot de passe, ce qui reste fonctionnel mais moins robuste.
 */
export const SESSION_COOKIE = "goelette_session";
export const SESSION_DURATION_S = 60 * 60 * 24 * 7; // 7 jours

const encoder = new TextEncoder();

function secret(): string | null {
  const password = process.env.FOUNDER_PASSWORD;
  if (!password) return null;
  return process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16
    ? process.env.AUTH_SECRET
    : `derived:${password}:la-goelette`;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(key: string, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data)));
}

/** Comparaison à temps constant de deux chaînes. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(nowMs: number = Date.now()): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const expires = Math.floor(nowMs / 1000) + SESSION_DURATION_S;
  const payload = `founder.${expires}`;
  return `${payload}.${await hmac(key, payload)}`;
}

export async function verifySessionToken(token: string | undefined | null, nowMs: number = Date.now()): Promise<boolean> {
  const key = secret();
  if (!key || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "founder") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires * 1000 < nowMs) return false;
  const expected = await hmac(key, `${parts[0]}.${parts[1]}`);
  return safeEqual(expected, parts[2]);
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const password = process.env.FOUNDER_PASSWORD;
  if (!password || typeof candidate !== "string") return false;
  // Comparaison des empreintes pour éviter de révéler la longueur.
  const [a, b] = await Promise.all([hmac("pw-check", candidate), hmac("pw-check", password)]);
  return safeEqual(a, b);
}

/** Lecture du cookie de session depuis un en-tête Cookie brut. */
export function readCookie(header: string | null, name: string = SESSION_COOKIE): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export async function isFounderRequest(request: Request): Promise<boolean> {
  return verifySessionToken(readCookie(request.headers.get("cookie")));
}

/** Authentification des agents logiciels (API machine). */
export function isAgentRequest(request: Request): boolean {
  const token = process.env.AGENT_API_TOKEN;
  if (!token || token.length < 24) return false;
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  return safeEqual(given, token);
}
