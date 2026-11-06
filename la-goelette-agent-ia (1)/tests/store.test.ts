import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __resetStore, acceptProposal, createMission, decideApproval, finishExecution, getSnapshot,
  heartbeatExecution, listApprovals, listEvents, registerAgent, requestApproval, saveProposal,
  startExecution, updateMissionStatus, DomainError, getMission, hasDemoData,
} from "@/server/store";
import { planWithRules, sanitizeTasks } from "@/server/ceo/planner";
import { demoAssignmentsAreValid } from "@/server/demo-seed";

const founder = { type: "founder" as const, id: "fondateur", label: "Fondateur" };

beforeEach(() => {
  delete process.env.APP_MODE;
  __resetStore();
});

test("mode démo : données signalées et aucun poste working", () => {
  const snap = getSnapshot();
  assert.equal(snap.mode, "demo");
  assert.equal(snap.totals.positions, 50);
  assert.equal(snap.totals.working, 0);
  assert.ok(hasDemoData());
  assert.ok(snap.positions.filter((p) => p.agent).every((p) => p.agent!.provenance === "demo"));
  assert.ok(demoAssignmentsAreValid());
});

test("mode connecté : aucune donnée de démonstration", () => {
  process.env.APP_MODE = "connected";
  __resetStore();
  const snap = getSnapshot();
  assert.equal(snap.totals.occupied, 0);
  assert.equal(snap.totals.vacant, 50);
  assert.equal(hasDemoData(), false);
});

test("création de mission : validation du département et du poste", () => {
  assert.throws(() => createMission({ title: "Test", departmentId: "XXX" }, founder), DomainError);
  assert.throws(() => createMission({ title: "Test", departmentId: "MKT", positionId: "FIN-01" }, founder), DomainError);
  const m = createMission({ title: "Plan", departmentId: "MKT", positionId: "MKT-03" }, founder);
  assert.equal(m.status, "assigned");
  assert.equal(m.provenance, "real");
  assert.ok(listEvents({ entityId: m.id }).some((e) => e.type === "mission.created"));
});

test("in_progress ne peut pas être posé à la main", () => {
  const m = createMission({ title: "Plan", departmentId: "MKT", positionId: "MKT-03" }, founder);
  assert.throws(() => updateMissionStatus(m.id, "in_progress", founder), DomainError);
});

test("cycle d'exécution réel : working puis retour, avec événements", () => {
  process.env.APP_MODE = "connected";
  __resetStore();
  const agent = registerAgent({ name: "Agent réel", positionId: "MKT-04" });
  const m = createMission({ title: "Calendrier", departmentId: "MKT", positionId: "MKT-04" }, founder);
  const exe = startExecution(m.id, agent.id);
  assert.equal(getMission(m.id)!.status, "in_progress");
  const view = getSnapshot().positions.find((p) => p.position.id === "MKT-04")!;
  assert.equal(view.deskState, "working");
  assert.throws(() => startExecution(m.id, agent.id), DomainError, "pas d'exécution concurrente");
  heartbeatExecution(exe.id, agent.id);
  finishExecution(exe.id, agent.id, "succeeded", { resultSummary: "OK" });
  assert.equal(getMission(m.id)!.status, "completed");
  assert.equal(getSnapshot().positions.find((p) => p.position.id === "MKT-04")!.deskState, "available");
});

test("un agent de démonstration ne peut pas lancer d'exécution", () => {
  const m = createMission({ title: "X", departmentId: "MKT", positionId: "MKT-01" }, founder);
  assert.throws(() => startExecution(m.id, "AGT-DEMO-04"), DomainError);
});

test("validation : la mission est bloquée tant que le fondateur n'a pas décidé", () => {
  process.env.APP_MODE = "connected";
  __resetStore();
  const agent = registerAgent({ name: "Pub", positionId: "MKT-02" });
  const m = createMission({ title: "Campagne", departmentId: "MKT", positionId: "MKT-02" }, founder);
  const apr = requestApproval(
    { requestedBy: "MKT-02", actionType: "spending", description: "Budget", consequences: "Dépense", riskLevel: "medium", missionId: m.id },
    { type: "agent", id: agent.id },
  );
  assert.equal(getMission(m.id)!.status, "waiting_approval");
  assert.throws(() => startExecution(m.id, agent.id), DomainError);
  decideApproval(apr.id, "approved", "fondateur", null);
  assert.equal(getMission(m.id)!.status, "assigned");
  assert.throws(() => decideApproval(apr.id, "rejected", "fondateur", null), DomainError, "pas de double décision");
  assert.equal(listApprovals("pending").length, 0);
});

test("planificateur à règles : marketing prioritaire et contrôle qualité", () => {
  const plan = planWithRules("Je veux plus de clients le midi grâce à Instagram");
  assert.ok(plan.matchedDepartments.includes("MKT"));
  assert.ok(plan.tasks.some((t) => t.positionId === "DIR-04"));
  assert.ok(plan.tasks.some((t) => t.approvalType === "spending"));
  const fallback = planWithRules("zzz");
  assert.deepEqual(fallback.matchedDepartments, ["MKT"]);
});

test("acceptation d'une proposition : missions créées et validations demandées", () => {
  const plan = planWithRules("campagne de publicité locale");
  const p = saveProposal({ objective: "campagne", reformulation: plan.reformulation, tasks: plan.tasks, source: "rules" });
  const before = listApprovals("pending").length;
  acceptProposal(p.id, null, founder);
  assert.equal(p.missionIds.length, plan.tasks.length);
  assert.ok(listApprovals("pending").length > before);
  assert.throws(() => acceptProposal(p.id, null, founder), DomainError);
});

test("tâches IA : postes inconnus rejetés, approbations filtrées", () => {
  const tasks = sanitizeTasks([
    { title: "OK", positionId: "MKT-01", approvalType: "spending", priority: "high" },
    { title: "Inconnu", positionId: "ZZZ-99" },
    { title: "", positionId: "MKT-02" },
    { title: "Bizarre", positionId: "FIN-01", approvalType: "hack", priority: "urgent" },
  ]);
  assert.equal(tasks.length, 2);
  assert.equal(tasks[1].approvalType, null);
  assert.equal(tasks[1].priority, "normal");
  assert.equal(tasks[1].departmentId, "FIN");
});
