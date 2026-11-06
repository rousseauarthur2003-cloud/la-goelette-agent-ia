/**
 * SOURCE DE DONNÉES UNIQUE de l'organigramme : 10 départements, 50 postes.
 * Les identifiants proviennent strictement du cahier des charges (§6).
 * Toute autre représentation (CSV, carte 2D, pages) est dérivée de ce fichier.
 */
import type { Department, Position } from "@/types/domain";

export const DEPARTMENTS: Department[] = [
  {
    id: "DIR",
    slug: "direction",
    name: "Direction exécutive",
    shortName: "Direction",
    description:
      "Pilote l'entreprise : le CEO IA reçoit les objectifs du fondateur, les décompose en missions, délègue, contrôle la qualité et rend compte. La stratégie et la qualité y sont rattachées.",
    objectives: [
      "Traduire les objectifs du fondateur en missions claires",
      "Coordonner les dix départements",
      "Garantir la qualité des livrables et le respect des validations",
    ],
    managerPositionId: "DIR-01",
    color: "#263B56",
    floorColor: "#D9D2C2",
    room: { x: 33, y: 34, width: 54, height: 19 },
  },
  {
    id: "MKT",
    slug: "marketing",
    name: "Marketing & publicité",
    shortName: "Marketing",
    description:
      "Département prioritaire au lancement. Conçoit les campagnes, anime les réseaux sociaux, travaille le référencement et mesure les résultats.",
    objectives: [
      "Développer la notoriété locale de La Goélette",
      "Planifier et suivre les campagnes publicitaires",
      "Structurer la présence sur les réseaux sociaux",
    ],
    managerPositionId: "MKT-01",
    color: "#D97868",
    floorColor: "#EAD8CF",
    room: { x: 3, y: 4, width: 25, height: 19 },
    priority: true,
  },
  {
    id: "COM",
    slug: "creation",
    name: "Création & communication",
    shortName: "Création",
    description:
      "Produit les contenus : textes, visuels, photographies et ligne éditoriale, dans le respect de l'identité de marque.",
    objectives: [
      "Tenir une ligne éditoriale cohérente",
      "Produire des contenus conformes à la charte",
      "Constituer une bibliothèque de visuels validés",
    ],
    managerPositionId: "COM-01",
    color: "#E0B04F",
    floorColor: "#EFE3C4",
    room: { x: 33, y: 4, width: 25, height: 19 },
  },
  {
    id: "SAL",
    slug: "commercial",
    name: "Commercial & développement",
    shortName: "Commercial",
    description:
      "Identifie les opportunités, développe les partenariats et suit les indicateurs commerciaux.",
    objectives: [
      "Identifier des partenaires locaux pertinents",
      "Développer les repas de groupe et les événements",
      "Suivre les indicateurs commerciaux",
    ],
    managerPositionId: "SAL-01",
    color: "#B8935A",
    floorColor: "#E6D7BA",
    room: { x: 63, y: 4, width: 25, height: 19 },
  },
  {
    id: "CX",
    slug: "experience-client",
    name: "Expérience client",
    shortName: "Expérience client",
    description:
      "Veille à la satisfaction : réponses aux clients, fidélisation, analyse des avis et traitement des réclamations.",
    objectives: [
      "Répondre aux avis avec le ton de la marque",
      "Mesurer et améliorer la satisfaction",
      "Mettre en place des actions de fidélisation",
    ],
    managerPositionId: "CX-01",
    color: "#5E93C2",
    floorColor: "#D3E0EA",
    room: { x: 93, y: 4, width: 24, height: 19 },
  },
  {
    id: "FIN",
    slug: "finance",
    name: "Finance & comptabilité",
    shortName: "Finance",
    description:
      "Suit la comptabilité, les budgets, la rentabilité et le contrôle de gestion. Aucune dépense ne peut être engagée sans validation du fondateur.",
    objectives: [
      "Suivre les budgets par département",
      "Analyser la rentabilité de l'offre",
      "Préparer les éléments comptables",
    ],
    managerPositionId: "FIN-01",
    color: "#667A8A",
    floorColor: "#D6DBDD",
    room: { x: 3, y: 34, width: 25, height: 19 },
  },
  {
    id: "IT",
    slug: "informatique",
    name: "Informatique & automatisation",
    shortName: "Informatique",
    description:
      "Construit et maintient les outils : site web, automatisations, intégrations IA et données.",
    objectives: [
      "Fiabiliser la plateforme La Goélette",
      "Connecter les premiers agents IA réels",
      "Organiser et sécuriser les données",
    ],
    managerPositionId: "IT-01",
    color: "#3F6E8C",
    floorColor: "#CFDBE0",
    room: { x: 93, y: 34, width: 24, height: 19 },
  },
  {
    id: "CUL",
    slug: "recherche-culinaire",
    name: "Recherche et développement culinaire",
    shortName: "Recherche culinaire",
    description:
      "Imagine et documente l'offre culinaire : recettes, fiches techniques, innovation et veille des tendances.",
    objectives: [
      "Documenter les recettes en fiches techniques",
      "Proposer des créations de saison",
      "Suivre les tendances gastronomiques",
    ],
    managerPositionId: "CUL-01",
    color: "#7E9A72",
    floorColor: "#DCE4D5",
    room: { x: 3, y: 64, width: 35, height: 20 },
  },
  {
    id: "OPS",
    slug: "production",
    name: "Production & opérations",
    shortName: "Production",
    description:
      "Organise la production, les procédures, la logistique et la relation fournisseurs.",
    objectives: [
      "Formaliser les procédures de production",
      "Optimiser la logistique et les approvisionnements",
      "Suivre la relation fournisseurs",
    ],
    managerPositionId: "OPS-01",
    color: "#9A7B56",
    floorColor: "#E3D8C6",
    room: { x: 43, y: 64, width: 35, height: 20 },
  },
  {
    id: "ADM",
    slug: "administration",
    name: "Administration & juridique",
    shortName: "Administration",
    description:
      "Gère l'administratif, les ressources humaines et la conformité réglementaire.",
    objectives: [
      "Tenir à jour les obligations administratives",
      "Veiller à la conformité",
      "Accompagner l'organisation RH",
    ],
    managerPositionId: "ADM-01",
    color: "#8C7FA3",
    floorColor: "#E0DBE6",
    room: { x: 83, y: 64, width: 34, height: 20 },
  },
];

// Positions locales des bureaux (cahier §5), en tuiles relatives à la salle.
const L6 = [
  { x: 6, y: 7 }, { x: 13, y: 7 }, { x: 20, y: 7 },
  { x: 6, y: 13 }, { x: 13, y: 13 }, { x: 20, y: 13 },
];
const L5 = [
  { x: 6, y: 7 }, { x: 13, y: 7 }, { x: 20, y: 7 },
  { x: 9, y: 13 }, { x: 17, y: 13 },
];
const L4_ADM = [
  { x: 8, y: 7 }, { x: 18, y: 7 }, { x: 8, y: 13 }, { x: 18, y: 13 },
];
// Direction : le CEO est placé au centre du bâtiment (ajustement documenté
// dans docs/maps/floor-plan.md) ; les trois autres postes gardent les
// positions indicatives du cahier.
const L4_DIR = [
  { x: 26, y: 9 }, { x: 14, y: 6 }, { x: 38, y: 6 }, { x: 14, y: 13 },
];

const BASE_PERMISSIONS = ["lire:entreprise", "proposer:mission", "commenter:mission"];
const MANAGER_PERMISSIONS = [...BASE_PERMISSIONS, "affecter:mission:departement", "relire:livrable:departement"];

const DEPT_TOOLS: Record<string, string[]> = {
  DIR: ["planification", "rédaction de rapports", "tableau de bord"],
  MKT: ["rédaction", "analyse de campagnes", "calendrier éditorial"],
  COM: ["rédaction", "brief visuel", "bibliothèque de médias"],
  SAL: ["fichier prospects", "rédaction", "analyse commerciale"],
  CX: ["boîte de réception avis", "rédaction", "enquêtes de satisfaction"],
  FIN: ["tableur", "analyse financière", "budget"],
  IT: ["dépôt de code", "automatisations", "base de données"],
  CUL: ["fiches techniques", "veille", "calcul de coûts matière"],
  OPS: ["procédures", "planning", "suivi fournisseurs"],
  ADM: ["documents administratifs", "veille réglementaire", "registre"],
};

type RawPosition = [id: string, title: string, skills: string[], description: string];

const RAW: Record<string, RawPosition[]> = {
  DIR: [
    ["DIR-01", "CEO IA", ["planification", "délégation", "arbitrage", "reporting"], "Reçoit les objectifs du fondateur, les reformule, les découpe en missions, délègue aux départements, contrôle les livrables et rend compte."],
    ["DIR-02", "Assistant de direction", ["organisation", "synthèse", "suivi"], "Assiste le CEO : agenda des missions, comptes rendus, relances et suivi des validations."],
    ["DIR-03", "Responsable stratégie", ["analyse stratégique", "veille", "priorisation"], "Éclaire les décisions : analyse du marché local, priorités et scénarios."],
    ["DIR-04", "Responsable qualité", ["contrôle qualité", "conformité de marque", "relecture"], "Contrôle la qualité et la conformité des livrables avant présentation au fondateur."],
  ],
  MKT: [
    ["MKT-01", "Directeur marketing", ["stratégie marketing", "budget", "coordination"], "Définit la stratégie marketing et coordonne l'équipe."],
    ["MKT-02", "Responsable campagnes publicitaires", ["publicité en ligne", "ciblage", "mesure"], "Prépare et suit les campagnes publicitaires. Toute dépense est soumise à validation."],
    ["MKT-03", "Community manager", ["animation", "modération", "ton de marque"], "Anime la communauté et prépare les réponses aux commentaires."],
    ["MKT-04", "Responsable réseaux sociaux", ["calendrier éditorial", "formats sociaux", "statistiques"], "Planifie les publications sur les réseaux sociaux."],
    ["MKT-05", "Responsable SEO", ["référencement", "fiche d'établissement", "contenus web"], "Améliore la visibilité dans les moteurs de recherche."],
    ["MKT-06", "Analyste marketing", ["analyse de données", "tableaux de bord", "recommandations"], "Mesure les résultats et formule des recommandations."],
  ],
  COM: [
    ["COM-01", "Responsable éditorial", ["ligne éditoriale", "planification", "relecture"], "Garantit la cohérence éditoriale de tous les contenus."],
    ["COM-02", "Rédacteur publicitaire", ["rédaction persuasive", "accroches", "ton de marque"], "Rédige les textes publicitaires et promotionnels."],
    ["COM-03", "Créateur de contenu", ["formats courts", "scénarisation", "rédaction"], "Imagine et produit des contenus pour les différents canaux."],
    ["COM-04", "Graphiste", ["mise en page", "charte graphique", "déclinaisons"], "Conçoit les supports visuels dans le respect de la charte."],
    ["COM-05", "Responsable photo et visuels", ["direction photo", "retouche légère", "photothèque"], "Organise la photothèque et prépare les briefs photo."],
  ],
  SAL: [
    ["SAL-01", "Directeur commercial", ["stratégie commerciale", "négociation", "pilotage"], "Définit la stratégie commerciale. Aucun engagement contractuel sans validation."],
    ["SAL-02", "Responsable prospection", ["prospection", "qualification", "relance"], "Identifie et qualifie des prospects (entreprises, groupes)."],
    ["SAL-03", "Responsable partenariats", ["partenariats locaux", "relation", "propositions"], "Développe des partenariats avec les acteurs locaux."],
    ["SAL-04", "Responsable développement", ["nouvelles offres", "étude de marché", "projets"], "Étudie de nouvelles offres et opportunités de développement."],
    ["SAL-05", "Analyste commercial", ["indicateurs", "prévisions", "reporting"], "Analyse les indicateurs commerciaux."],
  ],
  CX: [
    ["CX-01", "Responsable expérience client", ["parcours client", "qualité de service", "pilotage"], "Pilote la qualité de l'expérience client."],
    ["CX-02", "Agent service client", ["réponses clients", "ton de marque", "information pratique"], "Prépare les réponses aux demandes des clients."],
    ["CX-03", "Responsable fidélisation", ["programmes de fidélité", "relation client", "animation"], "Imagine des actions de fidélisation."],
    ["CX-04", "Analyste satisfaction", ["analyse d'avis", "enquêtes", "synthèse"], "Analyse les avis et la satisfaction."],
    ["CX-05", "Responsable réclamations", ["médiation", "résolution", "suivi"], "Traite les réclamations avec tact et propose des solutions."],
  ],
  FIN: [
    ["FIN-01", "Directeur financier", ["pilotage financier", "trésorerie", "arbitrage"], "Pilote la santé financière. Aucun paiement sans validation du fondateur."],
    ["FIN-02", "Comptable", ["saisie", "rapprochement", "pièces justificatives"], "Prépare les éléments comptables."],
    ["FIN-03", "Analyste financier", ["rentabilité", "analyse de coûts", "scénarios"], "Analyse la rentabilité et les coûts."],
    ["FIN-04", "Contrôleur de gestion", ["indicateurs de gestion", "écarts", "tableaux de bord"], "Suit les écarts entre prévisions et réalisations."],
    ["FIN-05", "Responsable budgets", ["budgets", "allocation", "suivi"], "Construit et suit les budgets par département."],
  ],
  IT: [
    ["IT-01", "CTO", ["architecture", "sécurité", "pilotage technique"], "Pilote la plateforme technique et la sécurité."],
    ["IT-02", "Développeur web", ["développement web", "accessibilité", "performance"], "Développe et maintient le site et la plateforme."],
    ["IT-03", "Développeur automatisation", ["automatisation", "intégrations", "scripts"], "Automatise les tâches répétitives."],
    ["IT-04", "Expert IA et intégrations", ["modèles IA", "orchestration", "évaluation"], "Connecte et évalue les agents IA."],
    ["IT-05", "Responsable données", ["modélisation", "qualité des données", "sauvegardes"], "Organise, protège et sauvegarde les données."],
  ],
  CUL: [
    ["CUL-01", "Directeur recherche culinaire", ["direction culinaire", "cohérence de carte", "arbitrage"], "Pilote la recherche culinaire en lien avec le chef."],
    ["CUL-02", "Chef créatif", ["création de plats", "associations de saveurs", "dressage"], "Propose des idées de plats et de dressages."],
    ["CUL-03", "Développeur recettes", ["formulation", "grammages", "tests"], "Formalise les recettes et leurs grammages."],
    ["CUL-04", "Responsable innovation", ["innovation", "techniques", "prototypage"], "Explore de nouvelles techniques et concepts."],
    ["CUL-05", "Responsable fiches techniques", ["fiches techniques", "coûts matière", "allergènes"], "Rédige les fiches techniques (coûts, allergènes, étapes)."],
    ["CUL-06", "Analyste tendances gastronomiques", ["veille", "tendances", "saisonnalité"], "Suit les tendances et la saisonnalité des produits."],
  ],
  OPS: [
    ["OPS-01", "Directeur des opérations", ["organisation", "pilotage opérationnel", "amélioration continue"], "Pilote l'organisation opérationnelle."],
    ["OPS-02", "Responsable production", ["planification", "mise en place", "rendement"], "Organise la production et la mise en place."],
    ["OPS-03", "Responsable procédures", ["procédures", "hygiène", "formation"], "Rédige et tient à jour les procédures."],
    ["OPS-04", "Responsable logistique", ["stocks", "réceptions", "rotation"], "Suit les stocks et la logistique."],
    ["OPS-05", "Responsable fournisseurs", ["achats", "comparaison", "relation fournisseurs"], "Suit les fournisseurs. Aucune commande sans validation."],
  ],
  ADM: [
    ["ADM-01", "Responsable administratif", ["administration", "échéances", "classement"], "Tient les obligations administratives à jour."],
    ["ADM-02", "Assistant administratif", ["classement", "courriers", "suivi"], "Assiste sur le classement et les courriers."],
    ["ADM-03", "Responsable RH", ["plannings", "recrutement", "règles sociales"], "Accompagne l'organisation des ressources humaines."],
    ["ADM-04", "Responsable conformité", ["réglementation", "données personnelles", "affichages obligatoires"], "Veille à la conformité réglementaire."],
  ],
};

const LAYOUTS: Record<string, { x: number; y: number }[]> = {
  DIR: L4_DIR, MKT: L6, COM: L5, SAL: L5, CX: L5, FIN: L5, IT: L5, CUL: L6, OPS: L5, ADM: L4_ADM,
};

export const POSITIONS: Position[] = DEPARTMENTS.flatMap((dept) =>
  RAW[dept.id].map(([id, title, skills, description], index) => {
    const isManager = dept.managerPositionId === id;
    const permissions =
      id === "DIR-01"
        ? [...MANAGER_PERMISSIONS, "planifier:objectif", "deleguer:mission:tous", "demander:validation"]
        : isManager
          ? MANAGER_PERMISSIONS
          : BASE_PERMISSIONS;
    return {
      id,
      departmentId: dept.id,
      title,
      description,
      skills,
      toolsAllowed: DEPT_TOOLS[dept.id],
      permissions,
      deskLocal: LAYOUTS[dept.id][index],
    } satisfies Position;
  }),
);

const deptById = new Map(DEPARTMENTS.map((d) => [d.id, d]));
const deptBySlug = new Map(DEPARTMENTS.map((d) => [d.slug, d]));
const positionById = new Map(POSITIONS.map((p) => [p.id, p]));

export function getDepartment(id: string): Department | undefined {
  return deptById.get(id);
}
export function getDepartmentBySlug(slug: string): Department | undefined {
  return deptBySlug.get(slug);
}
export function getPosition(id: string): Position | undefined {
  return positionById.get(id);
}
export function positionsOf(departmentId: string): Position[] {
  return POSITIONS.filter((p) => p.departmentId === departmentId);
}
/** Coordonnées absolues (tuiles) du bureau d'un poste. */
export function absoluteDesk(position: Position): { x: number; y: number } {
  const dept = deptById.get(position.departmentId)!;
  return { x: dept.room.x + position.deskLocal.x, y: dept.room.y + position.deskLocal.y };
}

/** Inventaire CSV (Annexe A). Le statut est `vacant` tant qu'aucun agent réel n'est affecté. */
export function inventoryCsv(): string {
  const header = "position_id,department_id,department_name,title,assigned_agent_id,status";
  const rows = POSITIONS.map((p) => {
    const d = deptById.get(p.departmentId)!;
    return [p.id, d.id, d.name, p.title, "", "vacant"].map(csvCell).join(",");
  });
  return [header, ...rows].join("\n") + "\n";
}

export function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
