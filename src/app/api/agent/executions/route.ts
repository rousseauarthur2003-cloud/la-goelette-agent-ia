import { isAgentRequest } from "@/server/auth";
import { errorResponse, json, readJson, str } from "@/server/http";
import { startExecution } from "@/server/store";

export const dynamic = "force-dynamic";

/** Début d'une exécution réelle : seul cet appel peut faire passer un poste en `working`. */
export async function POST(request: Request) {
  if (!isAgentRequest(request)) return json({ error: "Jeton agent invalide ou API agents désactivée." }, 401);
  try {
    const body = await readJson(request);
    const execution = startExecution(
      str(body, "missionId", { required: true, max: 20 })!,
      str(body, "agentId", { required: true, max: 20 })!,
    );
    return json({ execution }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
