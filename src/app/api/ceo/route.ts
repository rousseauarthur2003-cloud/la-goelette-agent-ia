import { actorOf, errorResponse, json, readJson, str } from "@/server/http";
import { listCeoMessages, listProposals } from "@/server/store";
import { handleObjective } from "@/server/ceo/ceo";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ messages: listCeoMessages(), proposals: listProposals() });
}

// Évite les soumissions concurrentes involontaires (double clic, plusieurs onglets).
let busy = false;

export async function POST(request: Request) {
  if (busy) return json({ error: "Le CEO traite déjà un objectif. Réessayez dans un instant." }, 429);
  busy = true;
  try {
    const actor = await actorOf(request);
    const body = await readJson(request);
    const objective = str(body, "objective", { required: true, min: 5, max: 1500 })!;
    const reply = await handleObjective(objective, actor.label);
    return json(reply, 201);
  } catch (err) {
    return errorResponse(err);
  } finally {
    busy = false;
  }
}
