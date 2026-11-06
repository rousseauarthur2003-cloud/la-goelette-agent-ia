/**
 * Dépôt de données EN MÉMOIRE (non persistant).
 *
 * Toutes les données vivent dans le processus Node.js : un redémarrage ou un
 * redéploiement les remet à zéro. L'interface le signale. Une implémentation
 * PostgreSQL pourra remplacer ce module en conservant les mêmes fonctions
 * (voir docs/architecture/data-model.md et db/schema.sql).
 */
import type {
  Agent,
  AppEvent,
  Approval,
  ApprovalActionType,
  CompanySnapshot,
  Execution,
  Mission,
  MissionPriority,
  MissionStatus,
  PositionView,
  RiskLevel,
} from "@/types/domain";
import { DEPARTMENTS, POSITIONS, absoluteDesk, getDepartment, getPosition } from "@/lib/organization";
import { deriveDeskState } from "@/lib/status";
import { MISSION_STATUSES } from "@/lib/labels";
import { buildDemoSeed } from "./demo-seed";
import { getConfig } from "./config";

export interface CeoMessage {
  id: string;
  role: "founder" | "ceo";
  content: string;
  createdAt: string;
  source: "founder" | "rules" | "ai";
  proposalId?: string;
}

export interface ProposedTask {
  title: string;
  description: string;
  departmentId: string;
  positionId: string;
  priority: MissionPriority;
  deliverable: string;
  approvalType: ApprovalActionType | null;
}

export interface Proposal {
  id: string;
  objective: string;
  reformulation: string;
  tasks: ProposedTask[];
  source: "rules" | "ai";
  status: "proposed" | "accepted" | "dismissed";
  createdAt: string;
  missionIds: string[];
}

interface State {
  startedAt: string;
  agents: Agent[];
  executions: Execution[];
  missions: Mission[];
  events: AppEvent[];
  approvals: Approval[];
  ceoMessages: CeoMessage[];
  proposals: Proposal[];
  counters: Record<string, number>;
}

const LIMITS = { missions: 1000, events: 5000, messages: 400, commentsPerMission: 100 };

declare global {
  // eslint-disable-next-line no-var
  var __goeletteState: State | undefined;
}

function createState(): State {
  const cfg = getConfig();
  const seed = cfg.mode === "demo" ? buildDemoSeed() : { agents: [], missions: [], approvals: [], events: [] };
  return {
    startedAt: new Date().toISOString(),
    agents: seed.agents,
    executions: [],
    missions: seed.missions,
    events: [
      ...seed.events,
      {
        id: "EVT-BOOT",
        type: "system.info",
        actorType: "system",
        actorId: "system",
        entityType: "company",
        entityId: "goelette",
        departmentId: null,
        summary: `Démarrage du serveur (mode ${cfg.mode === "demo" ? "démonstration" : "connecté"}, stockage en mémoire)`,
        payload: {},
        createdAt: new Date().toISOString(),
        provenance: "real",
      },
    ],
    approvals: seed.approvals,
    ceoMessages: [],
    proposals: [],
    counters: {},
  };
}

function state(): State {
  if (!globalThis.__goeletteState) globalThis.__goeletteState = createState();
  return globalThis.__goeletteState;
}

/** Réinitialisation (tests uniquement). */
export function __resetStore(): void {
  globalThis.__goeletteState = createState();
}

function nextId(prefix: string): string {
  const s = state();
  s.counters[prefix] = (s.counters[prefix] ?? 0) + 1;
  return `${prefix}-${String(s.counters[prefix]).padStart(4, "0")}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function recordEvent(e: Omit<AppEvent, "id" | "createdAt" | "provenance"> & { provenance?: AppEvent["provenance"] }): AppEvent {
  const s = state();
  const event: AppEvent = { ...e, id: nextId("EVT"), createdAt: nowIso(), provenance: e.provenance ?? "real" };
  s.events.push(event);
  if (s.events.length > LIMITS.events) s.events.splice(0, s.events.length - LIMITS.events);
  return event;
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

export function getStartedAt(): string {
  return state().startedAt;
}

export function listAgents(): Agent[] {
  return [...state().agents];
}

export function getAgent(id: string): Agent | undefined {
  return state().agents.find((a) => a.id === id);
}

export function agentForPosition(positionId: string): Agent | null {
  return state().agents.find((a) => a.positionId === positionId) ?? null;
}

export function listExecutions(): Execution[] {
  return [...state().executions];
}

export function listMissions(filter: { departmentId?: string; status?: MissionStatus; positionId?: string } = {}): Mission[] {
  return state()
    .missions.filter(
      (m) =>
        (!filter.departmentId || m.departmentId === filter.departmentId) &&
        (!filter.status || m.status === filter.status) &&
        (!filter.positionId || m.assignedPositionId === filter.positionId),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getMission(id: string): Mission | undefined {
  return state().missions.find((m) => m.id === id);
}

export function listEvents(filter: { type?: string; departmentId?: string; entityId?: string; limit?: number } = {}): AppEvent[] {
  const list = state()
    .events.filter(
      (e) =>
        (!filter.type || e.type === filter.type || e.type.startsWith(`${filter.type}.`)) &&
        (!filter.departmentId || e.departmentId === filter.departmentId) &&
        (!filter.entityId || e.entityId === filter.entityId),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return filter.limit ? list.slice(0, filter.limit) : list;
}

export function listApprovals(status?: Approval["status"]): Approval[] {
  return state()
    .approvals.filter((a) => !status || a.status === status)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export function listCeoMessages(): CeoMessage[] {
  return [...state().ceoMessages];
}

export function listProposals(): Proposal[] {
  return [...state().proposals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function positionView(positionId: string, now: number = Date.now()): PositionView | null {
  const position = getPosition(positionId);
  if (!position) return null;
  const dept = getDepartment(position.departmentId)!;
  const agent = agentForPosition(positionId);
  const derived = deriveDeskState(agent, state().executions, now);
  const currentMission = derived.liveExecution
    ? getMission(derived.liveExecution.missionId) ?? null
    : listMissions({ positionId }).find((m) => ["assigned", "in_progress", "waiting_approval"].includes(m.status)) ?? null;
  return {
    position,
    department: { id: dept.id, name: dept.name, slug: dept.slug, color: dept.color },
    agent,
    deskState: derived.state,
    deskStateReason: derived.reason,
    activeExecution: derived.liveExecution,
    currentMission,
    desk: absoluteDesk(position),
  };
}

export function getSnapshot(now: number = Date.now()): CompanySnapshot {
  const cfg = getConfig();
  const positions = POSITIONS.map((p) => positionView(p.id, now)!);
  const count = (st: string) => positions.filter((v) => v.deskState === st).length;
  const missions = Object.fromEntries(MISSION_STATUSES.map((st) => [st, 0])) as Record<MissionStatus, number>;
  for (const m of state().missions) missions[m.status]++;
  const occupied = positions.filter((v) => v.agent).length;
  const working = count("working");
  const available = count("available");
  const inactive = count("inactive");
  return {
    generatedAt: new Date(now).toISOString(),
    mode: cfg.mode,
    persistence: "memory",
    totals: {
      positions: positions.length,
      occupied,
      vacant: positions.length - occupied,
      available,
      working,
      inactive,
      otherStates: occupied - working - available - inactive,
    },
    missions,
    pendingApprovals: listApprovals("pending").length,
    positions,
  };
}

export function hasDemoData(): boolean {
  const s = state();
  return [...s.agents, ...s.missions, ...s.approvals].some((x) => x.provenance === "demo");
}

// ---------------------------------------------------------------------------
// Écriture : missions
// ---------------------------------------------------------------------------

export class DomainError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface MissionInput {
  title: string;
  description?: string;
  objective?: string;
  departmentId: string;
  positionId?: string | null;
  priority?: MissionPriority;
  dueAt?: string | null;
  deliverable?: string;
  status?: "draft" | "pending";
}

export function createMission(input: MissionInput, actor: { type: AppEvent["actorType"]; id: string; label: string }): Mission {
  const s = state();
  if (s.missions.length >= LIMITS.missions) throw new DomainError("Nombre maximal de missions atteint pour le stockage en mémoire.", 409);
  const dept = getDepartment(input.departmentId);
  if (!dept) throw new DomainError("Département inconnu.");
  let positionId: string | null = input.positionId || null;
  if (positionId) {
    const pos = getPosition(positionId);
    if (!pos || pos.departmentId !== dept.id) throw new DomainError("Le poste choisi n'appartient pas à ce département.");
  }
  const agent = positionId ? agentForPosition(positionId) : null;
  const mission: Mission = {
    id: nextId("MIS"),
    title: input.title,
    description: input.description ?? "",
    objective: input.objective ?? "",
    status: positionId ? "assigned" : input.status ?? "pending",
    priority: input.priority ?? "normal",
    departmentId: dept.id,
    assignedAgentId: agent?.id ?? null,
    assignedPositionId: positionId,
    createdAt: nowIso(),
    startedAt: null,
    completedAt: null,
    dueAt: input.dueAt ?? null,
    deliverable: input.deliverable ?? "",
    resultSummary: null,
    comments: [],
    createdBy: actor.label,
    provenance: "real",
  };
  if (input.status === "draft") mission.status = "draft";
  s.missions.push(mission);
  recordEvent({
    type: "mission.created",
    actorType: actor.type,
    actorId: actor.id,
    entityType: "mission",
    entityId: mission.id,
    departmentId: dept.id,
    summary: `Mission « ${mission.title} » créée`,
    payload: { status: mission.status, positionId },
  });
  if (positionId) {
    recordEvent({
      type: "mission.assigned",
      actorType: actor.type,
      actorId: actor.id,
      entityType: "mission",
      entityId: mission.id,
      departmentId: dept.id,
      summary: `Mission affectée au poste ${positionId}`,
      payload: { positionId },
    });
  }
  return mission;
}

/**
 * Transitions autorisées depuis l'interface (fondateur).
 * `in_progress` n'est jamais posé à la main : il découle du démarrage d'une
 * exécution réelle par un agent (API agents).
 */
const MANUAL_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  draft: ["pending", "cancelled"],
  pending: ["assigned", "cancelled", "draft"],
  assigned: ["pending", "cancelled", "completed", "failed"],
  in_progress: ["cancelled"],
  waiting_approval: ["cancelled"],
  completed: [],
  failed: ["pending", "cancelled"],
  cancelled: ["draft"],
};

export function allowedManualTransitions(status: MissionStatus): MissionStatus[] {
  return MANUAL_TRANSITIONS[status];
}

export function updateMissionStatus(
  id: string,
  next: MissionStatus,
  actor: { type: AppEvent["actorType"]; id: string },
  resultSummary?: string,
): Mission {
  const mission = getMission(id);
  if (!mission) throw new DomainError("Mission introuvable.", 404);
  if (!MANUAL_TRANSITIONS[mission.status].includes(next)) {
    throw new DomainError(`Transition non autorisée : ${mission.status} → ${next}.`, 409);
  }
  if (next === "assigned" && !mission.assignedPositionId) {
    throw new DomainError("Choisissez d'abord un poste responsable.");
  }
  const previous = mission.status;
  mission.status = next;
  if (next === "completed" || next === "failed") mission.completedAt = nowIso();
  if (resultSummary) mission.resultSummary = resultSummary;
  recordEvent({
    type: "mission.status_changed",
    actorType: actor.type,
    actorId: actor.id,
    entityType: "mission",
    entityId: mission.id,
    departmentId: mission.departmentId,
    summary: `« ${mission.title} » : ${previous} → ${next}`,
    payload: { from: previous, to: next },
  });
  return mission;
}

export function assignMission(id: string, positionId: string, actor: { type: AppEvent["actorType"]; id: string }): Mission {
  const mission = getMission(id);
  if (!mission) throw new DomainError("Mission introuvable.", 404);
  if (["completed", "cancelled", "in_progress"].includes(mission.status)) {
    throw new DomainError("Cette mission ne peut plus être réaffectée.", 409);
  }
  const pos = getPosition(positionId);
  if (!pos || pos.departmentId !== mission.departmentId) throw new DomainError("Poste invalide pour ce département.");
  mission.assignedPositionId = positionId;
  mission.assignedAgentId = agentForPosition(positionId)?.id ?? null;
  if (mission.status === "pending" || mission.status === "draft") mission.status = "assigned";
  recordEvent({
    type: "mission.assigned",
    actorType: actor.type,
    actorId: actor.id,
    entityType: "mission",
    entityId: mission.id,
    departmentId: mission.departmentId,
    summary: `« ${mission.title} » affectée au poste ${positionId}`,
    payload: { positionId },
  });
  return mission;
}

export function addComment(id: string, author: string, body: string, actor: { type: AppEvent["actorType"]; id: string }): Mission {
  const mission = getMission(id);
  if (!mission) throw new DomainError("Mission introuvable.", 404);
  if (mission.comments.length >= LIMITS.commentsPerMission) throw new DomainError("Trop de commentaires sur cette mission.", 409);
  mission.comments.push({ id: nextId("COM"), author, body, createdAt: nowIso() });
  recordEvent({
    type: "mission.commented",
    actorType: actor.type,
    actorId: actor.id,
    entityType: "mission",
    entityId: mission.id,
    departmentId: mission.departmentId,
    summary: `Commentaire de ${author} sur « ${mission.title} »`,
    payload: {},
  });
  return mission;
}

// ---------------------------------------------------------------------------
// Écriture : validations (approbations)
// ---------------------------------------------------------------------------

export function requestApproval(input: {
  requestedBy: string;
  actionType: ApprovalActionType;
  description: string;
  consequences: string;
  riskLevel: RiskLevel;
  missionId?: string | null;
}, actor: { type: AppEvent["actorType"]; id: string }): Approval {
  const approval: Approval = {
    id: nextId("APR"),
    requestedBy: input.requestedBy,
    actionType: input.actionType,
    description: input.description,
    consequences: input.consequences,
    riskLevel: input.riskLevel,
    status: "pending",
    missionId: input.missionId ?? null,
    requestedAt: nowIso(),
    decidedAt: null,
    decidedBy: null,
    decisionComment: null,
    provenance: "real",
  };
  state().approvals.push(approval);
  if (approval.missionId) {
    const mission = getMission(approval.missionId);
    if (mission && !["completed", "cancelled", "failed"].includes(mission.status)) mission.status = "waiting_approval";
  }
  recordEvent({
    type: "approval.requested",
    actorType: actor.type,
    actorId: actor.id,
    entityType: "approval",
    entityId: approval.id,
    departmentId: approval.missionId ? getMission(approval.missionId)?.departmentId ?? null : null,
    summary: `Validation demandée : ${approval.description}`,
    payload: { actionType: approval.actionType, riskLevel: approval.riskLevel },
  });
  return approval;
}

/** Seul le fondateur authentifié peut décider (contrôlé par la route API). */
export function decideApproval(id: string, decision: "approved" | "rejected", founderId: string, comment: string | null): Approval {
  const approval = state().approvals.find((a) => a.id === id);
  if (!approval) throw new DomainError("Demande de validation introuvable.", 404);
  if (approval.status !== "pending") throw new DomainError("Cette demande a déjà été traitée.", 409);
  approval.status = decision;
  approval.decidedAt = nowIso();
  approval.decidedBy = founderId;
  approval.decisionComment = comment;
  if (approval.missionId) {
    const mission = getMission(approval.missionId);
    if (mission && mission.status === "waiting_approval") {
      mission.status = decision === "approved" ? (mission.assignedPositionId ? "assigned" : "pending") : "cancelled";
    }
  }
  recordEvent({
    type: decision === "approved" ? "approval.approved" : "approval.rejected",
    actorType: "founder",
    actorId: founderId,
    entityType: "approval",
    entityId: approval.id,
    departmentId: approval.missionId ? getMission(approval.missionId)?.departmentId ?? null : null,
    summary: `${decision === "approved" ? "Validation accordée" : "Validation rejetée"} : ${approval.description}`,
    payload: { comment },
  });
  return approval;
}

// ---------------------------------------------------------------------------
// Écriture : agents et exécutions (API machine, protégée par AGENT_API_TOKEN)
// ---------------------------------------------------------------------------

export function registerAgent(input: { name: string; positionId: string; capabilities?: string[] }): Agent {
  const pos = getPosition(input.positionId);
  if (!pos) throw new DomainError("Poste inconnu.");
  const existing = agentForPosition(pos.id);
  if (existing && existing.provenance !== "demo") throw new DomainError("Ce poste a déjà un agent réel.", 409);
  const s = state();
  if (existing) s.agents = s.agents.filter((a) => a.id !== existing.id); // un agent réel remplace l'agent de démonstration
  const agent: Agent = {
    id: nextId("AGT"),
    name: input.name,
    role: pos.title,
    positionId: pos.id,
    departmentId: pos.departmentId,
    status: "available",
    connectionStatus: "connected",
    capabilities: input.capabilities?.length ? input.capabilities : pos.skills,
    toolsAllowed: pos.toolsAllowed,
    permissions: pos.permissions,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastSeenAt: nowIso(),
    provenance: "real",
  };
  s.agents.push(agent);
  recordEvent({
    type: "agent.status_changed",
    actorType: "agent",
    actorId: agent.id,
    entityType: "agent",
    entityId: agent.id,
    departmentId: agent.departmentId,
    summary: `Agent ${agent.name} enregistré au poste ${pos.id}`,
    payload: { positionId: pos.id },
  });
  return agent;
}

export function startExecution(missionId: string, agentId: string): Execution {
  const mission = getMission(missionId);
  const agent = getAgent(agentId);
  if (!mission) throw new DomainError("Mission introuvable.", 404);
  if (!agent || agent.provenance === "demo") throw new DomainError("Agent réel introuvable.", 404);
  if (mission.assignedPositionId !== agent.positionId) throw new DomainError("Cette mission n'est pas affectée au poste de cet agent.", 403);
  if (mission.status === "waiting_approval") throw new DomainError("Mission en attente de validation : exécution refusée.", 409);
  if (!["assigned", "pending"].includes(mission.status)) throw new DomainError("La mission n'est pas exécutable dans son état actuel.", 409);
  const s = state();
  if (s.executions.some((e) => e.missionId === missionId && e.status === "running")) {
    throw new DomainError("Une exécution est déjà en cours pour cette mission.", 409);
  }
  const t = nowIso();
  const execution: Execution = {
    id: nextId("EXE"),
    missionId,
    agentId,
    status: "running",
    startedAt: t,
    heartbeatAt: t,
    finishedAt: null,
    errorMessage: null,
    metadata: {},
    provenance: "real",
  };
  s.executions.push(execution);
  mission.status = "in_progress";
  mission.startedAt = mission.startedAt ?? t;
  mission.assignedAgentId = agentId;
  agent.lastSeenAt = t;
  recordEvent({
    type: "execution.started",
    actorType: "agent",
    actorId: agentId,
    entityType: "execution",
    entityId: execution.id,
    departmentId: mission.departmentId,
    summary: `Début d'exécution de « ${mission.title} » par ${agent.name}`,
    payload: { missionId },
  });
  return execution;
}

export function heartbeatExecution(executionId: string, agentId: string): Execution {
  const exe = state().executions.find((e) => e.id === executionId);
  if (!exe || exe.agentId !== agentId) throw new DomainError("Exécution introuvable.", 404);
  if (exe.status !== "running") throw new DomainError("Exécution terminée.", 409);
  exe.heartbeatAt = nowIso();
  const agent = getAgent(agentId);
  if (agent) agent.lastSeenAt = exe.heartbeatAt;
  return exe;
}

export function finishExecution(
  executionId: string,
  agentId: string,
  outcome: "succeeded" | "failed",
  detail: { resultSummary?: string; errorMessage?: string },
): Execution {
  const exe = state().executions.find((e) => e.id === executionId);
  if (!exe || exe.agentId !== agentId) throw new DomainError("Exécution introuvable.", 404);
  if (exe.status !== "running") throw new DomainError("Exécution déjà terminée.", 409);
  exe.status = outcome;
  exe.finishedAt = nowIso();
  exe.errorMessage = outcome === "failed" ? detail.errorMessage ?? "Erreur non précisée" : null;
  const mission = getMission(exe.missionId);
  if (mission) {
    // Un livrable terminé repasse par le contrôle du fondateur/CEO : la mission
    // est marquée terminée côté exécution, avec son résumé.
    mission.status = outcome === "succeeded" ? "completed" : "failed";
    mission.completedAt = exe.finishedAt;
    if (detail.resultSummary) mission.resultSummary = detail.resultSummary;
  }
  recordEvent({
    type: outcome === "succeeded" ? "execution.finished" : "execution.failed",
    actorType: "agent",
    actorId: agentId,
    entityType: "execution",
    entityId: exe.id,
    departmentId: mission?.departmentId ?? null,
    summary: outcome === "succeeded" ? `Fin d'exécution de « ${mission?.title} »` : `Échec d'exécution de « ${mission?.title} »`,
    payload: { missionId: exe.missionId },
  });
  return exe;
}

// ---------------------------------------------------------------------------
// CEO : conversation et propositions
// ---------------------------------------------------------------------------

export function addCeoMessage(msg: Omit<CeoMessage, "id" | "createdAt">): CeoMessage {
  const s = state();
  const message: CeoMessage = { ...msg, id: nextId("MSG"), createdAt: nowIso() };
  s.ceoMessages.push(message);
  if (s.ceoMessages.length > LIMITS.messages) s.ceoMessages.splice(0, s.ceoMessages.length - LIMITS.messages);
  return message;
}

export function saveProposal(p: Omit<Proposal, "id" | "createdAt" | "status" | "missionIds">): Proposal {
  const proposal: Proposal = { ...p, id: nextId("PRP"), createdAt: nowIso(), status: "proposed", missionIds: [] };
  state().proposals.push(proposal);
  recordEvent({
    type: "ceo.plan_proposed",
    actorType: "ceo",
    actorId: "DIR-01",
    entityType: "company",
    entityId: proposal.id,
    departmentId: "DIR",
    summary: `Plan proposé (${proposal.tasks.length} missions) — ${proposal.source === "ai" ? "IA" : "règles de démonstration"}`,
    payload: { objective: proposal.objective },
  });
  return proposal;
}

export function acceptProposal(id: string, taskIndexes: number[] | null, actor: { type: AppEvent["actorType"]; id: string; label: string }): Proposal {
  const proposal = state().proposals.find((p) => p.id === id);
  if (!proposal) throw new DomainError("Proposition introuvable.", 404);
  if (proposal.status !== "proposed") throw new DomainError("Cette proposition a déjà été traitée.", 409);
  const selected = proposal.tasks.filter((_, i) => !taskIndexes || taskIndexes.includes(i));
  for (const task of selected) {
    const mission = createMission(
      {
        title: task.title,
        description: task.description,
        objective: proposal.objective,
        departmentId: task.departmentId,
        positionId: task.positionId,
        priority: task.priority,
        deliverable: task.deliverable,
      },
      actor,
    );
    proposal.missionIds.push(mission.id);
    if (task.approvalType) {
      requestApproval(
        {
          requestedBy: `DIR-01 — CEO IA (pour ${task.positionId})`,
          actionType: task.approvalType,
          description: `Avant exécution : ${task.title}`,
          consequences: "L'exécution de cette mission est bloquée tant que le fondateur n'a pas décidé.",
          riskLevel: "medium",
          missionId: mission.id,
        },
        { type: "ceo", id: "DIR-01" },
      );
    }
  }
  proposal.status = "accepted";
  return proposal;
}

export function dismissProposal(id: string): Proposal {
  const proposal = state().proposals.find((p) => p.id === id);
  if (!proposal) throw new DomainError("Proposition introuvable.", 404);
  if (proposal.status !== "proposed") throw new DomainError("Cette proposition a déjà été traitée.", 409);
  proposal.status = "dismissed";
  return proposal;
}

export { DEPARTMENTS };
