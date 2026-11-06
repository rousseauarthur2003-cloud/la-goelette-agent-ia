/**
 * Abstraction des fournisseurs IA. Les clés restent exclusivement côté serveur.
 * Implémenté : Anthropic (API Messages, appel HTTP direct, sans SDK).
 * Statut : code prêt, NON TESTÉ contre l'API réelle dans cette version
 * (aucune clé disponible lors du développement).
 */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AiProvider {
  id: string;
  label: string;
  complete(input: { system: string; messages: ChatTurn[]; maxTokens?: number }): Promise<string>;
}

export class ProviderError extends Error {}

export function getProvider(): AiProvider | null {
  const id = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  if (id === "anthropic") return anthropicProvider(key, process.env.AI_MODEL || "");
  return null;
}

function anthropicProvider(apiKey: string, model: string): AiProvider {
  return {
    id: "anthropic",
    label: `Anthropic${model ? ` (${model})` : ""}`,
    async complete({ system, messages, maxTokens = 1500 }) {
      if (!model) throw new ProviderError("AI_MODEL n'est pas renseigné.");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60_000);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
          signal: controller.signal,
        });
        if (!res.ok) {
          // On ne renvoie jamais le corps brut (peut contenir des détails internes).
          throw new ProviderError(`Le fournisseur IA a répondu avec le statut ${res.status}.`);
        }
        const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
        const text = (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n");
        if (!text) throw new ProviderError("Réponse vide du fournisseur IA.");
        return text;
      } catch (err) {
        if (err instanceof ProviderError) throw err;
        throw new ProviderError("Impossible de joindre le fournisseur IA.");
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
