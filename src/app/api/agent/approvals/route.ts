import { isAgentRequest } from "@/server/auth";
import { errorResponse, json, oneOf, readJson, str } from "@/server/http";
import { requestApproval } from "@/server/store";

export const dynamic = "force-dynamic";

const ACTIONS = [
  "spending", "contract", "sensitive_publication", "mass_messaging", "price_change",
  "irreversible_deletion", "sensitive_data", "permission_change", "external_financial_legal",
] as const;

/**
 * Un agent peut DEMANDER une validation, jamais la décider.
 * La décision passe exclusivement par /api/approvals/[id] (fondateur authentifié).
 */
export async function POST(request: Request) {
  if (!isAgentRequest(request)) return json({ error: "Jeton agent invalide ou API agents désactivée." }, 401);
  try {
    const body = await readJson(request);
    const approval = requestApproval(
      {
        requestedBy: str(body, "requestedBy", { required: true, max: 120 })!,
        actionType: oneOf(str(body, "actionType", { required: true, max: 40 }), ACTIONS, "actionType")!,
        description: str(body, "description", { required: true, max: 500 })!,
        consequences: str(body, "consequences", { required: true, max: 1000 })!,
        riskLevel: oneOf(str(body, "riskLevel", { max: 10 }), ["low", "medium", "high", "critical"] as const, "riskLevel") ?? "medium",
        missionId: str(body, "missionId", { max: 20 }) ?? null,
      },
      { type: "agent", id: str(body, "agentId", { max: 20 }) ?? "agent" },
    );
    return json({ approval }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
