/**
 * Planificateur du CEO.
 *
 * - En mode démonstration (ou sans fournisseur IA configuré) : planificateur À RÈGLES,
 *   déterministe, explicitement présenté comme tel. Il ne prétend pas être une IA.
 * - En mode connecté avec fournisseur configuré : appel au fournisseur IA côté serveur.
 */
import type { ApprovalActionType, MissionPriority } from "@/types/domain";
import type { ProposedTask } from "@/server/store";
import { DEPARTMENTS, getPosition, positionsOf } from "@/lib/organization";

interface Rule {
  departmentId: string;
  keywords: string[];
  tasks: Array<{
    positionId: string;
    title: (o: string) => string;
    deliverable: string;
    priority?: MissionPriority;
    approvalType?: ApprovalActionType;
  }>;
}

const RULES: Rule[] = [
  {
    departmentId: "MKT",
    keywords: ["marketing", "pub", "publicit", "campagne", "notoriété", "visibilit", "client", "réseau", "instagram", "facebook", "seo", "google", "communication", "promo", "lancement", "attirer"],
    tasks: [
      { positionId: "MKT-01", title: () => "Cadrer la stratégie marketing de l'objectif", deliverable: "Note de cadrage : cibles, messages, canaux, indicateurs", priority: "high" },
      { positionId: "MKT-04", title: () => "Préparer le calendrier de publications", deliverable: "Calendrier éditorial daté par canal" },
      { positionId: "MKT-02", title: () => "Proposer une campagne publicitaire chiffrée", deliverable: "Proposition de campagne avec budget (soumise à validation)", approvalType: "spending" },
      { positionId: "MKT-06", title: () => "Définir les indicateurs de suivi", deliverable: "Tableau d'indicateurs et méthode de mesure" },
    ],
  },
  {
    departmentId: "COM",
    keywords: ["contenu", "texte", "visuel", "photo", "affiche", "flyer", "menu", "rédaction", "post", "vidéo", "graph"],
    tasks: [
      { positionId: "COM-01", title: () => "Définir l'angle éditorial", deliverable: "Brief éditorial conforme au ton de la marque" },
      { positionId: "COM-02", title: () => "Rédiger les textes associés", deliverable: "Textes prêts à relire" },
      { positionId: "COM-04", title: () => "Concevoir les supports visuels", deliverable: "Maquettes conformes à la charte" },
    ],
  },
  {
    departmentId: "SAL",
    keywords: ["vente", "commercial", "partenar", "groupe", "entreprise", "événement", "prospect", "chiffre"],
    tasks: [
      { positionId: "SAL-02", title: () => "Identifier les prospects pertinents", deliverable: "Liste qualifiée de prospects" },
      { positionId: "SAL-03", title: () => "Proposer des partenariats locaux", deliverable: "Propositions de partenariats (aucun engagement sans validation)", approvalType: "contract" },
    ],
  },
  {
    departmentId: "CX",
    keywords: ["avis", "satisfaction", "fidél", "réclamation", "accueil", "expérience"],
    tasks: [
      { positionId: "CX-04", title: () => "Analyser les avis et la satisfaction", deliverable: "Synthèse des points forts et axes d'amélioration" },
      { positionId: "CX-03", title: () => "Imaginer une action de fidélisation", deliverable: "Proposition d'action de fidélisation" },
    ],
  },
  {
    departmentId: "FIN",
    keywords: ["budget", "coût", "prix", "rentab", "financ", "marge", "dépense", "trésorerie"],
    tasks: [
      { positionId: "FIN-05", title: () => "Établir le budget nécessaire", deliverable: "Budget prévisionnel détaillé" },
      { positionId: "FIN-03", title: () => "Évaluer la rentabilité attendue", deliverable: "Analyse de rentabilité avec hypothèses explicites" },
    ],
  },
  {
    departmentId: "IT",
    keywords: ["site", "web", "automatis", "outil", "ia", "agent", "données", "logiciel", "intégration"],
    tasks: [
      { positionId: "IT-01", title: () => "Étudier la faisabilité technique", deliverable: "Note technique : options, risques, coûts" },
      { positionId: "IT-03", title: () => "Identifier les automatisations possibles", deliverable: "Liste d'automatisations priorisées" },
    ],
  },
  {
    departmentId: "CUL",
    keywords: ["recette", "plat", "carte", "cuisine", "menu", "saison", "dessert", "fiche technique", "culinaire"],
    tasks: [
      { positionId: "CUL-02", title: () => "Proposer des idées de plats", deliverable: "Propositions de plats argumentées" },
      { positionId: "CUL-05", title: () => "Rédiger les fiches techniques", deliverable: "Fiches techniques : grammages, coûts, allergènes" },
    ],
  },
  {
    departmentId: "OPS",
    keywords: ["production", "fournisseur", "stock", "logistique", "procédure", "organisation", "approvision"],
    tasks: [
      { positionId: "OPS-03", title: () => "Formaliser la procédure associée", deliverable: "Procédure écrite étape par étape" },
      { positionId: "OPS-05", title: () => "Comparer les fournisseurs", deliverable: "Comparatif fournisseurs (aucune commande sans validation)" },
    ],
  },
  {
    departmentId: "ADM",
    keywords: ["administratif", "juridique", "rh", "recrut", "conformité", "contrat", "légal", "rgpd"],
    tasks: [
      { positionId: "ADM-04", title: () => "Vérifier les points de conformité", deliverable: "Liste de contrôle réglementaire" },
      { positionId: "ADM-03", title: () => "Évaluer l'impact RH", deliverable: "Note RH" },
    ],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFC");
}

export interface PlanResult {
  reformulation: string;
  tasks: ProposedTask[];
  matchedDepartments: string[];
}

export function planWithRules(objective: string): PlanResult {
  const text = normalize(objective);
  let matched = RULES.filter((r) => r.keywords.some((k) => text.includes(k)));
  // Priorité métier initiale : le marketing (cahier §2).
  if (matched.length === 0) matched = RULES.filter((r) => r.departmentId === "MKT");
  matched = matched.slice(0, 4);

  const short = objective.length > 120 ? `${objective.slice(0, 117)}…` : objective;
  const tasks: ProposedTask[] = [];
  for (const rule of matched) {
    for (const t of rule.tasks.slice(0, rule.departmentId === "MKT" ? 4 : 2)) {
      tasks.push({
        title: t.title(objective),
        description: `Contribution du département à l'objectif : « ${short} »`,
        departmentId: rule.departmentId,
        positionId: t.positionId,
        priority: t.priority ?? "normal",
        deliverable: t.deliverable,
        approvalType: t.approvalType ?? null,
      });
    }
  }
  tasks.push({
    title: "Contrôle qualité des livrables",
    description: "Relire l'ensemble des livrables avant présentation au fondateur.",
    departmentId: "DIR",
    positionId: "DIR-04",
    priority: "normal",
    deliverable: "Rapport de contrôle qualité",
    approvalType: null,
  });

  const names = matched.map((r) => DEPARTMENTS.find((d) => d.id === r.departmentId)!.shortName);
  return {
    reformulation: `Objectif compris : « ${short} ». Départements mobilisés : ${names.join(", ")}, avec un contrôle qualité par la direction.`,
    tasks,
    matchedDepartments: matched.map((r) => r.departmentId),
  };
}

/** Valide et nettoie des tâches proposées par un fournisseur IA. */
export function sanitizeTasks(raw: unknown): ProposedTask[] {
  if (!Array.isArray(raw)) return [];
  const allowedApprovals: ApprovalActionType[] = [
    "spending", "contract", "sensitive_publication", "mass_messaging", "price_change",
    "irreversible_deletion", "sensitive_data", "permission_change", "external_financial_legal",
  ];
  const priorities: MissionPriority[] = ["low", "normal", "high", "critical"];
  const out: ProposedTask[] = [];
  for (const item of raw.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const positionId = String(t.positionId ?? "");
    const position = getPosition(positionId);
    if (!position) continue;
    const title = String(t.title ?? "").trim().slice(0, 140);
    if (!title) continue;
    out.push({
      title,
      description: String(t.description ?? "").slice(0, 1000),
      departmentId: position.departmentId,
      positionId,
      priority: priorities.includes(t.priority as MissionPriority) ? (t.priority as MissionPriority) : "normal",
      deliverable: String(t.deliverable ?? "").slice(0, 300),
      approvalType: allowedApprovals.includes(t.approvalType as ApprovalActionType) ? (t.approvalType as ApprovalActionType) : null,
    });
  }
  return out;
}

export function organizationBrief(): string {
  return DEPARTMENTS.map(
    (d) => `${d.id} ${d.name}: ${positionsOf(d.id).map((p) => `${p.id} ${p.title}`).join("; ")}`,
  ).join("\n");
}
