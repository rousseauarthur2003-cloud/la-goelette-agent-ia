import { json } from "@/server/http";
import { listApprovals } from "@/server/store";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ approvals: listApprovals() });
}
