/**
 * Types métier partagés entre l'interface, le moteur 2D et le serveur.
 * Voir cahier des charges §11 (modèle de données minimal).
 */

/** Origine d'une donnée (Annexe B — règle de vérité des données). */
export type Provenance = "real" | "computed" | "demo" | "estimate";

export interface RoomRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Department {
  id: string; // code court : DIR, MKT…
  slug: string;
  name: string;
  shortName: string;
  description: string;
  objectives: string[];
  managerPositionId: string;
  color: string;
  floorColor: string;
  room: RoomRect;
  /** Département prioritaire au lancement (marketing). */
  priority?: boolean;
}

export interface Position {
  id: string; // ex. MKT-01
  departmentId: string;
  title: string;
  description: string;
  skills: string[];
  toolsAllowed: string[];
  permissions: string[];
  /** Coordonnées locales (en tuiles) relatives à l'origine de la salle. */
  deskLocal: { x: number; y: number };
}

/** État d'un agent tel qu'enregistré (déclaré). */
export type AgentStatus =
  | "available"
  | "inactive"
  | "paused"
  | "error"
  | "waiting_approval"
  | "offline"
  | "unknown";

export type ConnectionStatus = "connected" | "disconnected" | "unknown";

export interface Agent {
  id: string;
  name: string;
  role: string;
  positionId: string;
  departmentId: string;
  status: AgentStatus;
  connectionStatus: ConnectionStatus;
  capabilities: string[];
  toolsAllowed: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
  provenance: Provenance;
}

export type ExecutionStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface Execution {
  id: string;
  missionId: string;
  agentId: string;
  status: ExecutionStatus;
  startedAt: string | null;
  heartbeatAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  provenance: Provenance;
}

export type MissionStatus =
  | "draft"
  | "pending"
  | "assigned"
  | "in_progress"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type MissionPriority = "low" | "normal" | "high" | "critical";

export interface MissionComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  objective: string;
  status: MissionStatus;
  priority: MissionPriority;
  departmentId: string;
  assignedAgentId: string | null;
  assignedPositionId: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  dueAt: string | null;
  deliverable: string;
  resultSummary: string | null;
  comments: MissionComment[];
  createdBy: string;
  provenance: Provenance;
}

export type EventType =
  | "mission.created"
  | "mission.assigned"
  | "mission.status_changed"
  | "mission.commented"
  | "execution.started"
  | "execution.heartbeat"
  | "execution.finished"
  | "execution.failed"
  | "agent.status_changed"
  | "approval.requested"
  | "approval.approved"
  | "approval.rejected"
  | "permission.changed"
  | "ceo.objective_received"
  | "ceo.plan_proposed"
  | "system.info";

export interface AppEvent {
  id: string;
  type: EventType;
  actorType: "founder" | "agent" | "system" | "ceo";
  actorId: string;
  entityType: "mission" | "agent" | "position" | "execution" | "approval" | "company";
  entityId: string;
  departmentId: string | null;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
  provenance: Provenance;
}

export type ApprovalActionType =
  | "spending"
  | "contract"
  | "sensitive_publication"
  | "mass_messaging"
  | "price_change"
  | "irreversible_deletion"
  | "sensitive_data"
  | "permission_change"
  | "external_financial_legal";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Approval {
  id: string;
  requestedBy: string;
  actionType: ApprovalActionType;
  description: string;
  consequences: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  missionId: string | null;
  requestedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionComment: string | null;
  provenance: Provenance;
}

/** État visuel d'un poste dans le siège (cahier §7). */
export type DeskState =
  | "working"
  | "available"
  | "inactive"
  | "vacant"
  | "error"
  | "paused"
  | "waiting_approval"
  | "offline"
  | "unknown";

/** Vue consolidée d'un poste, calculée côté serveur. */
export interface PositionView {
  position: Position;
  department: Pick<Department, "id" | "name" | "slug" | "color">;
  agent: Agent | null;
  deskState: DeskState;
  deskStateReason: string;
  activeExecution: Execution | null;
  currentMission: Mission | null;
  desk: { x: number; y: number }; // coordonnées absolues en tuiles
}

export interface CompanySnapshot {
  generatedAt: string;
  mode: "demo" | "connected";
  persistence: "memory" | "postgres";
  totals: {
    positions: number;
    occupied: number;
    vacant: number;
    available: number;
    working: number;
    inactive: number;
    otherStates: number;
  };
  missions: Record<MissionStatus, number>;
  pendingApprovals: number;
  positions: PositionView[];
}
