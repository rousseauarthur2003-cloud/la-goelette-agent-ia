import { actorOf, errorResponse, json, oneOf, readJson, str } from "@/server/http";
import { createMission, listMissions } from "@/server/store";
import { MISSION_STATUSES, PRIORITIES } from "@/lib/labels";
import type { MissionStatus } from "@/types/domain";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const departmentId = url.searchParams.get("department") ?? undefined;
  return json({
    missions: listMissions({
      status: MISSION_STATUSES.includes(status as MissionStatus) ? (status as MissionStatus) : undefined,
      departmentId,
    }),
  });
}

export async function POST(request: Request) {
  try {
    const actor = await actorOf(request);
    const body = await readJson(request);
    const dueAt = str(body, "dueAt", { max: 40 });
    if (dueAt && Number.isNaN(Date.parse(dueAt))) return json({ error: "Échéance invalide." }, 400);
    const mission = createMission(
      {
        title: str(body, "title", { required: true, min: 3, max: 140 })!,
        description: str(body, "description", { max: 2000 }),
        objective: str(body, "objective", { max: 500 }),
        departmentId: str(body, "departmentId", { required: true, max: 10 })!,
        positionId: str(body, "positionId", { max: 10 }) ?? null,
        priority: oneOf(str(body, "priority", { max: 10 }), PRIORITIES, "priority"),
        deliverable: str(body, "deliverable", { max: 300 }),
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        status: oneOf(str(body, "status", { max: 10 }), ["draft", "pending"] as const, "status"),
      },
      actor,
    );
    return json({ mission }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
