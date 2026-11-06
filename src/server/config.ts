/**
 * Configuration lue côté serveur uniquement. Aucun secret n'est exposé au navigateur.
 */
export interface ServerConfig {
  mode: "demo" | "connected";
  appName: string;
  authEnabled: boolean;
  aiProvider: "anthropic" | null;
  aiConfigured: boolean;
  aiModel: string | null;
  agentApiEnabled: boolean;
  databaseConfigured: boolean;
}

export function getConfig(): ServerConfig {
  const mode = process.env.APP_MODE === "connected" ? "connected" : "demo";
  const provider = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  const aiProvider = provider === "anthropic" ? "anthropic" : null;
  return {
    mode,
    appName: process.env.NEXT_PUBLIC_APP_NAME || "La Goëlette",
    authEnabled: Boolean(process.env.FOUNDER_PASSWORD),
    aiProvider,
    aiConfigured: Boolean(aiProvider && process.env.AI_API_KEY),
    aiModel: process.env.AI_MODEL || null,
    agentApiEnabled: Boolean(process.env.AGENT_API_TOKEN && process.env.AGENT_API_TOKEN.length >= 24),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
  };
}
