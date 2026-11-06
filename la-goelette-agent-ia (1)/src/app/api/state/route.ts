import { json } from "@/server/http";
import { getSnapshot, listEvents } from "@/server/store";

export const dynamic = "force-dynamic";

/** Instantané utilisé par le siège 2D et le tableau de bord (polling). */
export function GET() {
  return json({ snapshot: getSnapshot(), recentEvents: listEvents({ limit: 15 }) });
}
