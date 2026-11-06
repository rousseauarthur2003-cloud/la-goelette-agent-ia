import { csvCell, getDepartment } from "@/lib/organization";
import { getSnapshot, listEvents, listMissions } from "@/server/store";
import { DESK_STATE_LABELS } from "@/lib/status";
import { EVENT_LABELS, MISSION_STATUS_LABELS, PRIORITY_LABELS, PROVENANCE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

/** Export CSV (UTF-8 avec BOM pour une ouverture correcte dans Excel). */
export function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") ?? "missions";
  let rows: (string | null)[][];
  if (type === "positions") {
    rows = [["poste", "departement", "intitule", "agent", "etat", "provenance_agent"]];
    for (const v of getSnapshot().positions) {
      rows.push([v.position.id, v.department.name, v.position.title, v.agent?.name ?? "", DESK_STATE_LABELS[v.deskState], v.agent ? PROVENANCE_LABELS[v.agent.provenance] : ""]);
    }
  } else if (type === "events") {
    rows = [["date", "type", "resume", "departement", "provenance"]];
    for (const e of listEvents()) {
      rows.push([e.createdAt, EVENT_LABELS[e.type], e.summary, e.departmentId ? getDepartment(e.departmentId)?.name ?? "" : "", PROVENANCE_LABELS[e.provenance]]);
    }
  } else {
    rows = [["id", "titre", "departement", "poste", "priorite", "statut", "creation", "echeance", "livrable", "provenance"]];
    for (const m of listMissions()) {
      rows.push([m.id, m.title, getDepartment(m.departmentId)?.name ?? "", m.assignedPositionId, PRIORITY_LABELS[m.priority], MISSION_STATUS_LABELS[m.status], m.createdAt, m.dueAt, m.deliverable, PROVENANCE_LABELS[m.provenance]]);
    }
  }
  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
  const safeType = ["positions", "events"].includes(type) ? type : "missions";
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="la-goelette-${safeType}.csv"`,
      "cache-control": "no-store",
    },
  });
}
