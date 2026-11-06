/**
 * Orchestration du CEO : reçoit un objectif du fondateur et produit une
 * proposition de missions. Aucune mission n'est créée sans acceptation explicite.
 */
import { getConfig } from "@/server/config";
import { getProvider, ProviderError } from "@/server/providers";
import { addCeoMessage, listCeoMessages, recordEvent, saveProposal, type Proposal } from "@/server/store";
import { organizationBrief, planWithRules, sanitizeTasks } from "./planner";

const SYSTEM_PROMPT = `Tu es le CEO IA de La Goélette, une entreprise virtuelle liée à un restaurant familial (brasserie) en Vendée.
Le fondateur te donne un objectif. Tu le reformules, tu le découpes en missions concrètes et tu les affectes aux postes existants.
Règles :
- N'utilise QUE les identifiants de postes listés ci-dessous.
- Ne présente jamais une estimation comme un fait. N'invente ni prix, ni statistique, ni prestation.
- Toute dépense, engagement, publication sensible, envoi massif, modification de prix, suppression irréversible, accès à des données sensibles ou changement de permission doit porter un approvalType.
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{"reformulation": "...", "message": "réponse courte au fondateur", "tasks": [{"title": "...", "description": "...", "positionId": "MKT-01", "priority": "low|normal|high|critical", "deliverable": "...", "approvalType": null}]}

Organisation :
`;

export interface CeoReply {
  message: string;
  proposal: Proposal | null;
  source: "rules" | "ai";
  warning: string | null;
}

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function handleObjective(objective: string, founderLabel: string): Promise<CeoReply> {
  const cfg = getConfig();
  addCeoMessage({ role: "founder", content: objective, source: "founder" });
  recordEvent({
    type: "ceo.objective_received",
    actorType: "founder",
    actorId: founderLabel,
    entityType: "company",
    entityId: "goelette",
    departmentId: "DIR",
    summary: `Objectif transmis au CEO : « ${objective.slice(0, 80)} »`,
    payload: {},
  });

  const provider = cfg.mode === "connected" ? getProvider() : null;
  let warning: string | null = null;

  if (provider) {
    try {
      const history = listCeoMessages()
        .slice(-10)
        .map((m) => ({ role: m.role === "founder" ? ("user" as const) : ("assistant" as const), content: m.content }));
      const text = await provider.complete({ system: SYSTEM_PROMPT + organizationBrief(), messages: history });
      const json = extractJson(text);
      const tasks = sanitizeTasks(json?.tasks);
      if (json && tasks.length > 0) {
        const proposal = saveProposal({
          objective,
          reformulation: String(json.reformulation ?? "").slice(0, 1000),
          tasks,
          source: "ai",
        });
        const message = String(json.message ?? proposal.reformulation).slice(0, 2000);
        const msg = addCeoMessage({ role: "ceo", content: message, source: "ai", proposalId: proposal.id });
        return { message: msg.content, proposal, source: "ai", warning: null };
      }
      warning = "La réponse du fournisseur IA n'a pas pu être interprétée. Le planificateur à règles a été utilisé à la place.";
    } catch (err) {
      warning = `${err instanceof ProviderError ? err.message : "Erreur du fournisseur IA."} Le planificateur à règles a été utilisé à la place.`;
    }
  } else if (cfg.mode === "connected") {
    warning = "Mode connecté demandé mais aucun fournisseur IA n'est configuré (AI_PROVIDER, AI_API_KEY, AI_MODEL).";
  }

  const plan = planWithRules(objective);
  const proposal = saveProposal({ objective, reformulation: plan.reformulation, tasks: plan.tasks, source: "rules" });
  const content =
    `[CEO simulé — planificateur à règles, aucun modèle IA] ${plan.reformulation} ` +
    `Je propose ${plan.tasks.length} missions. Rien n'est lancé sans votre accord.`;
  const msg = addCeoMessage({ role: "ceo", content, source: "rules", proposalId: proposal.id });
  return { message: msg.content, proposal, source: "rules", warning };
}
