import { actorOf, errorResponse, json, oneOf, readJson, str } from "@/server/http";
import { acceptProposal, dismissProposal } from "@/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await actorOf(request);
    const body = await readJson(request);
    const action = oneOf(str(body, "action", { required: true, max: 10 }), ["accept", "dismiss"] as const, "action");
    if (action === "dismiss") return json({ proposal: dismissProposal(id) });
    const raw = body.taskIndexes;
    const indexes = Array.isArray(raw) ? raw.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < 50) : null;
    return json({ proposal: acceptProposal(id, indexes, actor) });
  } catch (err) {
    return errorResponse(err);
  }
}
