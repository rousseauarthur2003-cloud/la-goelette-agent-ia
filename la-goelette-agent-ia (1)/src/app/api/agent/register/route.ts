import { isAgentRequest } from "@/server/auth";
import { errorResponse, json, readJson, str } from "@/server/http";
import { registerAgent } from "@/server/store";

export const dynamic = "force-dynamic";

/** Enregistrement d'un agent logiciel réel sur un poste (jeton AGENT_API_TOKEN requis). */
export async function POST(request: Request) {
  if (!isAgentRequest(request)) return json({ error: "Jeton agent invalide ou API agents désactivée." }, 401);
  try {
    const body = await readJson(request);
    const agent = registerAgent({
      name: str(body, "name", { required: true, max: 60 })!,
      positionId: str(body, "positionId", { required: true, max: 10 })!,
    });
    return json({ agent }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
