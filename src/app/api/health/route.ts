import { json } from "@/server/http";
import { getConfig } from "@/server/config";
import { getStartedAt } from "@/server/store";

export const dynamic = "force-dynamic";

/** Vérification de santé utilisée pour contrôler un déploiement. */
export function GET() {
  const cfg = getConfig();
  return json({
    status: "ok",
    app: cfg.appName,
    mode: cfg.mode,
    persistence: "memory",
    startedAt: getStartedAt(),
    node: process.version,
  });
}
