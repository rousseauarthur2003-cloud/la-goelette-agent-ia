import { actorOf, errorResponse, json, oneOf, readJson, sensitiveForbidden, str } from "@/server/http";
import { decideApproval } from "@/server/store";

export const dynamic = "force-dynamic";

/** Décision sur une demande de validation : réservée au fondateur authentifié. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await actorOf(request);
    const forbidden = sensitiveForbidden(actor);
    if (forbidden) return forbidden;
    const { id } = await params;
    const body = await readJson(request);
    const decision = oneOf(str(body, "decision", { required: true, max: 10 }), ["approved", "rejected"] as const, "decision")!;
    const approval = decideApproval(id, decision, actor.id, str(body, "comment", { max: 1000 }) ?? null);
    return json({ approval });
  } catch (err) {
    return errorResponse(err);
  }
}
