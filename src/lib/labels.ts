import type {
  ApprovalActionType,
  ApprovalStatus,
  EventType,
  MissionPriority,
  MissionStatus,
  Provenance,
  RiskLevel,
} from "@/types/domain";

export const MISSION_STATUSES: MissionStatus[] = [
  "draft", "pending", "assigned", "in_progress", "waiting_approval", "completed", "failed", "cancelled",
];

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  assigned: "Affectée",
  in_progress: "En cours",
  waiting_approval: "Attente de validation",
  completed: "Terminée",
  failed: "En erreur",
  cancelled: "Annulée",
};

export const MISSION_STATUS_TONE: Record<MissionStatus, string> = {
  draft: "neutral",
  pending: "info",
  assigned: "info",
  in_progress: "success",
  waiting_approval: "warning",
  completed: "success",
  failed: "danger",
  cancelled: "neutral",
};

export const PRIORITIES: MissionPriority[] = ["low", "normal", "high", "critical"];
export const PRIORITY_LABELS: Record<MissionPriority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  critical: "Critique",
};

export const PROVENANCE_LABELS: Record<Provenance, string> = {
  real: "Donnée réelle",
  computed: "Calculée",
  demo: "Démonstration",
  estimate: "Estimation",
};

export const APPROVAL_ACTION_LABELS: Record<ApprovalActionType, string> = {
  spending: "Dépense ou paiement",
  contract: "Engagement contractuel",
  sensitive_publication: "Publication sensible",
  mass_messaging: "Envoi massif de messages",
  price_change: "Modification de prix",
  irreversible_deletion: "Suppression irréversible",
  sensitive_data: "Accès ou export de données sensibles",
  permission_change: "Modification des permissions",
  external_financial_legal: "Action externe à impact financier ou juridique",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
  critical: "Critique",
};

export const EVENT_LABELS: Record<EventType, string> = {
  "mission.created": "Mission créée",
  "mission.assigned": "Mission affectée",
  "mission.status_changed": "Statut de mission modifié",
  "mission.commented": "Commentaire",
  "execution.started": "Début d'exécution",
  "execution.heartbeat": "Heartbeat",
  "execution.finished": "Fin d'exécution",
  "execution.failed": "Erreur d'exécution",
  "agent.status_changed": "Changement d'état d'agent",
  "approval.requested": "Validation demandée",
  "approval.approved": "Validation accordée",
  "approval.rejected": "Validation rejetée",
  "permission.changed": "Permission modifiée",
  "ceo.objective_received": "Objectif reçu par le CEO",
  "ceo.plan_proposed": "Plan proposé par le CEO",
  "system.info": "Information système",
};

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });
}
