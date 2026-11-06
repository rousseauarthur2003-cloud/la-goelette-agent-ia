import { isAgentRequest } from "@/server/auth";
import { errorResponse, json, oneOf, readJson, str } from "@/server/http";
import { finishExecution, heartbeatExecution } from "@/server/store";

export const dynamic = "force-dynamic";

/** Heartbeat (toutes les 30 s recommandé) ou fin d'exécution. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAgentRequest(request)) return json({ error: "Jeton agent invalide ou API agents désactivée." }, 401);
  try {
    const { id } = await params;
    const body = await readJson(request);
    const agentId = str(body, "agentId", { required: true, max: 20 })!;
    const action = oneOf(str(body, "action", { required: true, max: 20 }), ["heartbeat", "succeeded", "failed"] as const, "action")!;
    const execution =
      action === "heartbeat"
        ? heartbeatExecution(id, agentId)
        : finishExecution(id, agentId, action, {
            resultSummary: str(body, "resultSummary", { max: 4000 }),
            errorMessage: str(body, "errorMessage", { max: 500 }),
          });
    return json({ execution });
  } catch (err) {
    return errorResponse(err);
  }
}
