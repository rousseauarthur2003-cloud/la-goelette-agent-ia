/**
 * Calcul de l'état visuel d'un poste (cahier §7).
 *
 * RÈGLE CRITIQUE : un poste n'est `working` que s'il existe une exécution
 * identifiée, liée à une mission, avec un statut non terminal, une date de
 * début et un heartbeat récent. Une session ou une conversation ouverte ne
 * suffit jamais. Un heartbeat expiré fait sortir le poste de `working`.
 */
import type { Agent, DeskState, Execution, ExecutionStatus } from "@/types/domain";

/** Durée de validité d'un heartbeat d'exécution. */
export const HEARTBEAT_TTL_MS = 90_000;

const NON_TERMINAL: ExecutionStatus[] = ["queued", "running"];

export function isExecutionLive(execution: Execution, now: number = Date.now()): boolean {
  if (!execution.missionId || !execution.agentId) return false;
  if (execution.status !== "running") return false;
  if (!NON_TERMINAL.includes(execution.status)) return false;
  if (!execution.startedAt || !execution.heartbeatAt) return false;
  const beat = Date.parse(execution.heartbeatAt);
  if (Number.isNaN(beat)) return false;
  return now - beat <= HEARTBEAT_TTL_MS;
}

export interface DeskStateResult {
  state: DeskState;
  reason: string;
  liveExecution: Execution | null;
}

export function deriveDeskState(
  agent: Agent | null,
  executions: Execution[],
  now: number = Date.now(),
): DeskStateResult {
  if (!agent) {
    return { state: "vacant", reason: "Aucun agent affecté à ce poste.", liveExecution: null };
  }

  const mine = executions.filter((e) => e.agentId === agent.id);
  const live = mine.find((e) => isExecutionLive(e, now)) ?? null;
  if (live) {
    return {
      state: "working",
      reason: `Exécution ${live.id} en cours (heartbeat récent).`,
      liveExecution: live,
    };
  }

  const stale = mine.find((e) => e.status === "running" && !isExecutionLive(e, now));
  if (stale) {
    return {
      state: "unknown",
      reason: `Exécution ${stale.id} déclarée en cours mais heartbeat expiré : état non confirmé.`,
      liveExecution: null,
    };
  }

  switch (agent.status) {
    case "available":
      return agent.connectionStatus === "connected"
        ? { state: "available", reason: "Agent affecté, connecté et sans mission en cours.", liveExecution: null }
        : { state: "inactive", reason: "Agent affecté mais non connecté.", liveExecution: null };
    case "inactive":
      return { state: "inactive", reason: "Agent affecté mais inactif.", liveExecution: null };
    case "offline":
      return { state: "offline", reason: "Agent hors ligne.", liveExecution: null };
    case "paused":
      return { state: "paused", reason: "Agent mis en pause.", liveExecution: null };
    case "error":
      return { state: "error", reason: "Agent en erreur.", liveExecution: null };
    case "waiting_approval":
      return { state: "waiting_approval", reason: "En attente d'une validation du fondateur.", liveExecution: null };
    default:
      return { state: "unknown", reason: "État non déterminé.", liveExecution: null };
  }
}

export const DESK_STATE_LABELS: Record<DeskState, string> = {
  working: "En exécution",
  available: "Disponible",
  inactive: "Inactif",
  vacant: "Poste vacant",
  error: "Erreur",
  paused: "En pause",
  waiting_approval: "Attente de validation",
  offline: "Hors ligne",
  unknown: "Inconnu",
};

export const DESK_STATE_COLORS: Record<DeskState, string> = {
  working: "#4E9A6B",
  available: "#78A9D1",
  inactive: "#A9A399",
  vacant: "#D8D2C6",
  error: "#D97868",
  paused: "#F3C96B",
  waiting_approval: "#E0A33E",
  offline: "#8B8B8B",
  unknown: "#B9A6C9",
};
