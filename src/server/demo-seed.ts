/**
 * Jeu de données de DÉMONSTRATION. Chaque enregistrement porte provenance="demo"
 * et apparaît avec la mention « Démonstration » dans l'interface.
 *
 * Aucune exécution n'est simulée : en démonstration, aucun poste n'est `working`,
 * conformément à la règle « working = exécution réelle avec heartbeat récent ».
 */
import type { Agent, AppEvent, Approval, Mission } from "@/types/domain";
import { POSITIONS, getPosition } from "@/lib/organization";

const DEMO_AGENT_ASSIGNMENTS: Array<[positionId: string, name: string, state: "available" | "inactive"]> = [
  ["DIR-01", "Capitaine", "available"],
  ["DIR-02", "Lison", "available"],
  ["DIR-04", "Margaux", "inactive"],
  ["MKT-01", "Élise", "available"],
  ["MKT-02", "Noé", "available"],
  ["MKT-03", "Inès", "available"],
  ["MKT-04", "Tom", "available"],
  ["MKT-05", "Yanis", "inactive"],
  ["MKT-06", "Clara", "available"],
  ["COM-01", "Bastien", "available"],
  ["COM-02", "Léa", "available"],
  ["COM-04", "Hugo", "inactive"],
  ["SAL-01", "Romane", "available"],
  ["SAL-03", "Malo", "inactive"],
  ["CX-01", "Jade", "available"],
  ["CX-02", "Nathan", "available"],
  ["CX-04", "Zoé", "inactive"],
  ["FIN-01", "Victor", "available"],
  ["FIN-05", "Anaïs", "inactive"],
  ["IT-01", "Sacha", "available"],
  ["IT-04", "Lou", "available"],
  ["CUL-01", "Gaspard", "available"],
  ["CUL-02", "Rose", "available"],
  ["CUL-05", "Mathis", "inactive"],
  ["OPS-01", "Agathe", "available"],
  ["OPS-05", "Basile", "inactive"],
  ["ADM-01", "Céleste", "available"],
  ["ADM-04", "Arsène", "inactive"],
];

function iso(hoursAgo: number, base: number): string {
  return new Date(base - hoursAgo * 3_600_000).toISOString();
}

export function buildDemoSeed(now: number = Date.now()) {
  const agents: Agent[] = DEMO_AGENT_ASSIGNMENTS.map(([positionId, name, state], i) => {
    const position = getPosition(positionId)!;
    return {
      id: `AGT-DEMO-${String(i + 1).padStart(2, "0")}`,
      name,
      role: position.title,
      positionId,
      departmentId: position.departmentId,
      status: state,
      connectionStatus: state === "available" ? "connected" : "disconnected",
      capabilities: position.skills,
      toolsAllowed: position.toolsAllowed,
      permissions: position.permissions,
      createdAt: iso(240, now),
      updatedAt: iso(2 + i, now),
      lastSeenAt: state === "available" ? iso(0.2, now) : iso(30 + i, now),
      provenance: "demo",
    };
  });

  const agentFor = (positionId: string) => agents.find((a) => a.positionId === positionId)?.id ?? null;

  const m = (
    id: string,
    title: string,
    departmentId: string,
    positionId: string | null,
    status: Mission["status"],
    priority: Mission["priority"],
    hoursAgo: number,
    deliverable: string,
    description: string,
    resultSummary: string | null = null,
  ): Mission => ({
    id,
    title,
    description,
    objective: "Développer la notoriété locale de La Goëlette (objectif de démonstration)",
    status,
    priority,
    departmentId,
    assignedAgentId: positionId ? agentFor(positionId) : null,
    assignedPositionId: positionId,
    createdAt: iso(hoursAgo, now),
    startedAt: null,
    completedAt: status === "completed" ? iso(hoursAgo - 20, now) : null,
    dueAt: status === "completed" ? null : iso(-72, now),
    deliverable,
    resultSummary,
    comments: [],
    createdBy: "CEO IA (démonstration)",
    provenance: "demo",
  });

  const missions: Mission[] = [
    m("MIS-D001", "Calendrier éditorial de décembre", "MKT", "MKT-04", "assigned", "high", 30,
      "Calendrier des publications Facebook et Instagram", "Proposer un rythme de publication et des thèmes pour le mois de décembre."),
    m("MIS-D002", "Audit de la fiche d'établissement", "MKT", "MKT-05", "pending", "normal", 26,
      "Liste de recommandations SEO local", "Relever les informations manquantes ou incohérentes de la fiche d'établissement."),
    m("MIS-D003", "Budget de campagne locale", "MKT", "MKT-02", "waiting_approval", "high", 20,
      "Proposition de campagne avec budget", "Préparer une campagne locale. La dépense nécessite la validation du fondateur."),
    m("MIS-D004", "Réponses types aux avis clients", "CX", "CX-02", "completed", "normal", 70,
      "Modèles de réponses au ton de la marque", "Rédiger des modèles de réponses chaleureux et professionnels.",
      "Six modèles de réponses rédigés (exemple de démonstration)."),
    m("MIS-D005", "Fiches techniques des plats du jour", "CUL", "CUL-05", "draft", "normal", 12,
      "Gabarit de fiche technique", "Définir un gabarit de fiche technique : grammages, coûts, allergènes."),
    m("MIS-D006", "Tableau de suivi des budgets", "FIN", "FIN-01", "assigned", "normal", 40,
      "Tableau de suivi mensuel", "Structurer le suivi des budgets par département."),
    m("MIS-D007", "Charte de ton éditorial", "COM", "COM-01", "completed", "low", 96,
      "Document de ton éditorial", "Synthétiser les règles de ton de la marque.",
      "Charte de ton rédigée (exemple de démonstration)."),
    m("MIS-D008", "Connexion du premier agent IA", "IT", "IT-04", "pending", "critical", 8,
      "Agent CEO connecté côté serveur", "Préparer la connexion d'un fournisseur IA réel pour le CEO."),
  ];

  const approvals: Approval[] = [
    {
      id: "APR-D001",
      requestedBy: "MKT-02 — Responsable campagnes publicitaires (démonstration)",
      actionType: "spending",
      description: "Lancer une campagne publicitaire locale de deux semaines.",
      consequences: "Engagerait une dépense publicitaire. Aucune dépense n'est réellement effectuée en démonstration.",
      riskLevel: "medium",
      status: "pending",
      missionId: "MIS-D003",
      requestedAt: iso(19, now),
      decidedAt: null,
      decidedBy: null,
      decisionComment: null,
      provenance: "demo",
    },
  ];

  const events: AppEvent[] = [
    ...missions.map((mi, i): AppEvent => ({
      id: `EVT-D${String(i + 1).padStart(3, "0")}`,
      type: "mission.created",
      actorType: "ceo",
      actorId: "DIR-01",
      entityType: "mission",
      entityId: mi.id,
      departmentId: mi.departmentId,
      summary: `Mission « ${mi.title} » créée`,
      payload: {},
      createdAt: mi.createdAt,
      provenance: "demo",
    })),
    {
      id: "EVT-D100",
      type: "approval.requested",
      actorType: "agent",
      actorId: "MKT-02",
      entityType: "approval",
      entityId: "APR-D001",
      departmentId: "MKT",
      summary: "Validation demandée : dépense de campagne locale",
      payload: {},
      createdAt: iso(19, now),
      provenance: "demo",
    },
  ];

  return { agents, missions, approvals, events };
}

/** Contrôle de cohérence utilisé par les tests. */
export function demoAssignmentsAreValid(): boolean {
  const ids = new Set(POSITIONS.map((p) => p.id));
  const seen = new Set<string>();
  return DEMO_AGENT_ASSIGNMENTS.every(([pid]) => {
    const ok = ids.has(pid) && !seen.has(pid);
    seen.add(pid);
    return ok;
  });
}
