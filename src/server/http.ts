/**
 * Utilitaires HTTP pour les routes API : validation des entrées, réponses JSON,
 * erreurs sans fuite d'information interne.
 */
import { DomainError } from "./store";
import { isFounderRequest } from "./auth";
import { getConfig } from "./config";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof DomainError) return json({ error: err.message }, err.status);
  if (err instanceof ValidationError) return json({ error: err.message }, 400);
  console.error("[api] erreur inattendue", err instanceof Error ? err.message : "inconnue");
  return json({ error: "Erreur interne. Réessayez plus tard." }, 500);
}

export class ValidationError extends Error {}

export async function readJson(request: Request, maxBytes = 20_000): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > maxBytes) throw new ValidationError("Requête trop volumineuse.");
  try {
    const data = JSON.parse(text || "{}");
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
    return data as Record<string, unknown>;
  } catch {
    throw new ValidationError("Corps de requête JSON invalide.");
  }
}

export function str(
  data: Record<string, unknown>,
  key: string,
  opts: { required?: boolean; max?: number; min?: number } = {},
): string | undefined {
  const raw = data[key];
  if (raw === undefined || raw === null || raw === "") {
    if (opts.required) throw new ValidationError(`Champ obligatoire manquant : ${key}.`);
    return undefined;
  }
  if (typeof raw !== "string") throw new ValidationError(`Champ invalide : ${key}.`);
  const value = raw.trim();
  if (opts.required && !value) throw new ValidationError(`Champ obligatoire manquant : ${key}.`);
  if (opts.min && value.length < opts.min) throw new ValidationError(`Champ trop court : ${key}.`);
  if (value.length > (opts.max ?? 2000)) throw new ValidationError(`Champ trop long : ${key}.`);
  return value;
}

export function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], key: string): T | undefined {
  if (value === undefined) return undefined;
  if (!allowed.includes(value as T)) throw new ValidationError(`Valeur non autorisée pour ${key}.`);
  return value as T;
}

export interface Actor {
  isFounder: boolean;
  type: "founder";
  id: string;
  label: string;
}

/** Identité de l'auteur d'une requête navigateur. */
export async function actorOf(request: Request): Promise<Actor> {
  const founder = await isFounderRequest(request);
  return founder
    ? { isFounder: true, type: "founder", id: "fondateur", label: "Fondateur" }
    : { isFounder: false, type: "founder", id: "visiteur-demo", label: "Visiteur (démonstration)" };
}

/**
 * Les actions sensibles exigent un fondateur authentifié. Si l'authentification
 * n'est pas configurée, elles sont désactivées (cahier §12).
 */
export function sensitiveForbidden(actor: Actor): Response | null {
  if (actor.isFounder) return null;
  const cfg = getConfig();
  return json(
    {
      error: cfg.authEnabled
        ? "Action réservée au fondateur connecté."
        : "Action sensible désactivée : configurez FOUNDER_PASSWORD et AUTH_SECRET pour activer la connexion du fondateur.",
    },
    403,
  );
}
