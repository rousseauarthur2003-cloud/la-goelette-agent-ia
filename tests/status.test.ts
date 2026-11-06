import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveDeskState, HEARTBEAT_TTL_MS, isExecutionLive } from "@/lib/status";
import type { Agent, Execution } from "@/types/domain";

const NOW = Date.parse("2026-11-06T12:00:00Z");
const agent: Agent = {
  id: "AGT-1", name: "Test", role: "x", positionId: "MKT-01", departmentId: "MKT",
  status: "available", connectionStatus: "connected", capabilities: [], toolsAllowed: [], permissions: [],
  createdAt: "", updatedAt: "", lastSeenAt: null, provenance: "real",
};
const exe = (over: Partial<Execution>): Execution => ({
  id: "EXE-1", missionId: "MIS-1", agentId: "AGT-1", status: "running",
  startedAt: new Date(NOW - 60_000).toISOString(), heartbeatAt: new Date(NOW - 10_000).toISOString(),
  finishedAt: null, errorMessage: null, metadata: {}, provenance: "real", ...over,
});

test("poste sans agent = vacant", () => {
  assert.equal(deriveDeskState(null, [], NOW).state, "vacant");
});

test("agent connecté sans exécution = available, jamais working", () => {
  assert.equal(deriveDeskState(agent, [], NOW).state, "available");
});

test("agent affecté mais déconnecté = inactive", () => {
  assert.equal(deriveDeskState({ ...agent, connectionStatus: "disconnected" }, [], NOW).state, "inactive");
});

test("exécution running + heartbeat récent = working", () => {
  const r = deriveDeskState(agent, [exe({})], NOW);
  assert.equal(r.state, "working");
  assert.equal(r.liveExecution?.id, "EXE-1");
});

test("heartbeat expiré : le personnage ne reste pas assis artificiellement", () => {
  const stale = exe({ heartbeatAt: new Date(NOW - HEARTBEAT_TTL_MS - 1).toISOString() });
  assert.equal(isExecutionLive(stale, NOW), false);
  assert.notEqual(deriveDeskState(agent, [stale], NOW).state, "working");
});

test("exécution sans mission, sans début ou terminée = pas working", () => {
  assert.equal(isExecutionLive(exe({ missionId: "" }), NOW), false);
  assert.equal(isExecutionLive(exe({ startedAt: null }), NOW), false);
  assert.equal(isExecutionLive(exe({ status: "succeeded" }), NOW), false);
  assert.equal(isExecutionLive(exe({ status: "queued" }), NOW), false);
});

test("l'exécution d'un autre agent ne rend pas ce poste working", () => {
  assert.equal(deriveDeskState(agent, [exe({ agentId: "AGT-2" })], NOW).state, "available");
});
