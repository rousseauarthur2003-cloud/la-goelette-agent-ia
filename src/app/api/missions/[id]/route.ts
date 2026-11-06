import { actorOf, errorResponse, json, oneOf, readJson, str } from "@/server/http";
import { addComment, allowedManualTransitions, assignMission, getMission, listEvents, updateMissionStatus } from "@/server/store";
import { MISSION_STATUSES } from "@/lib/labels";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) return json({ error: "Mission introuvable." }, 404);
  return json({ mission, allowed: allowedManualTransitions(mission.status), events: listEvents({ entityId: id }) });
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const actor = await actorOf(request);
    const body = await readJson(request);
    const action = oneOf(str(body, "action", { required: true, max: 20 }), ["status", "assign", "comment"] as const, "action");
    let mission;
    if (action === "status") {
      const status = oneOf(str(body, "status", { required: true, max: 20 }), MISSION_STATUSES, "status")!;
      mission = updateMissionStatus(id, status, actor, str(body, "resultSummary", { max: 2000 }));
    } else if (action === "assign") {
      mission = assignMission(id, str(body, "positionId", { required: true, max: 10 })!, actor);
    } else {
      mission = addComment(id, actor.label, str(body, "body", { required: true, max: 2000 })!, actor);
    }
    return json({ mission, allowed: allowedManualTransitions(mission.status) });
  } catch (err) {
    return errorResponse(err);
  }
}
