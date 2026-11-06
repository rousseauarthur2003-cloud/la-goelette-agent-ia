/**
 * Tests des routes API (appel direct des gestionnaires, sans serveur HTTP).
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetStore } from "@/server/store";
import { GET as health } from "@/app/api/health/route";
import { GET as state } from "@/app/api/state/route";
import { GET as listMissions, POST as createMission } from "@/app/api/missions/route";
import { PATCH as patchMission } from "@/app/api/missions/[id]/route";
import { POST as decide } from "@/app/api/approvals/[id]/route";
import { POST as ceo } from "@/app/api/ceo/route";
import { POST as proposal } from "@/app/api/ceo/proposals/[id]/route";
import { GET as exportCsv } from "@/app/api/reports/export/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/agent/register/route";
import { POST as startExe } from "@/app/api/agent/executions/route";
import { POST as exeAction } from "@/app/api/agent/executions/[id]/route";
import { POST as agentApproval } from "@/app/api/agent/approvals/route";

const URL0 = "http://localhost:3000";
const req = (path: string, body?: unknown, headers: Record<string, string> = {}, method = body ? "POST" : "GET") =>
  new Request(URL0 + path, { method, headers: { "content-type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  delete process.env.APP_MODE;
  delete process.env.FOUNDER_PASSWORD;
  delete process.env.AUTH_SECRET;
  delete process.env.AGENT_API_TOKEN;
  __resetStore();
});

test("GET /api/health", async () => {
  const res = health();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, "ok");
  assert.equal(data.mode, "demo");
});

test("GET /api/state : 50 postes, aucun working en démo", async () => {
  const data = await state().json();
  assert.equal(data.snapshot.positions.length, 50);
  assert.equal(data.snapshot.totals.working, 0);
});

test("POST /api/missions : validation des entrées", async () => {
  assert.equal((await createMission(req("/api/missions", { title: "x", departmentId: "MKT" }))).status, 400);
  assert.equal((await createMission(req("/api/missions", { title: "Bonne mission", departmentId: "NOPE" }))).status, 400);
  assert.equal((await createMission(req("/api/missions", { title: "Bonne mission", departmentId: "MKT", priority: "urgentissime" }))).status, 400);
  const bad = await createMission(new Request(URL0 + "/api/missions", { method: "POST", body: "{pas du json" }));
  assert.equal(bad.status, 400);
  const ok = await createMission(req("/api/missions", { title: "Calendrier", departmentId: "MKT", positionId: "MKT-04", dueAt: "2026-12-01" }));
  assert.equal(ok.status, 201);
  const { mission } = await ok.json();
  assert.equal(mission.status, "assigned");
  const list = await (listMissions(req("/api/missions?status=assigned"))).json();
  assert.ok(list.missions.some((m: { id: string }) => m.id === mission.id));
});

test("PATCH /api/missions/[id] : transitions contrôlées", async () => {
  const { mission } = await (await createMission(req("/api/missions", { title: "Plan", departmentId: "COM" }))).json();
  const r1 = await patchMission(req(`/api/missions/${mission.id}`, { action: "status", status: "in_progress" }, {}, "PATCH"), params(mission.id));
  assert.equal(r1.status, 409);
  const r2 = await patchMission(req(`/api/missions/${mission.id}`, { action: "assign", positionId: "COM-02" }, {}, "PATCH"), params(mission.id));
  assert.equal(r2.status, 200);
  const r3 = await patchMission(req(`/api/missions/${mission.id}`, { action: "comment", body: "Merci de revoir le ton." }, {}, "PATCH"), params(mission.id));
  assert.equal((await r3.json()).mission.comments.length, 1);
  const r4 = await patchMission(req(`/api/missions/INCONNUE`, { action: "status", status: "cancelled" }, {}, "PATCH"), params("INCONNUE"));
  assert.equal(r4.status, 404);
});

test("POST /api/approvals/[id] : refusé sans fondateur authentifié", async () => {
  const res = await decide(req("/api/approvals/APR-D001", { decision: "approved" }), params("APR-D001"));
  assert.equal(res.status, 403);
});

test("connexion fondateur puis décision de validation", async () => {
  process.env.FOUNDER_PASSWORD = "secret-fondateur";
  process.env.AUTH_SECRET = "une-longue-chaine-aleatoire-de-test";
  assert.equal((await login(req("/api/auth/login", { password: "faux" }))).status, 401);
  const ok = await login(req("/api/auth/login", { password: "secret-fondateur" }));
  assert.equal(ok.status, 200);
  const cookie = ok.headers.get("set-cookie")!.split(";")[0];
  assert.match(ok.headers.get("set-cookie")!, /HttpOnly/);
  const res = await decide(req("/api/approvals/APR-D001", { decision: "approved", comment: "OK" }, { cookie }), params("APR-D001"));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).approval.status, "approved");
});

test("CEO : objectif → proposition à règles → missions créées", async () => {
  const res = await ceo(req("/api/ceo", { objective: "Lancer une campagne Instagram pour le menu du midi" }));
  assert.equal(res.status, 201);
  const reply = await res.json();
  assert.equal(reply.source, "rules");
  assert.match(reply.message, /CEO simulé/);
  const acc = await proposal(req(`/api/ceo/proposals/${reply.proposal.id}`, { action: "accept", taskIndexes: [0, 1] }), params(reply.proposal.id));
  assert.equal(acc.status, 200);
  assert.equal((await acc.json()).proposal.missionIds.length, 2);
});

test("export CSV", async () => {
  const res = exportCsv(req("/api/reports/export?type=positions"));
  assert.match(res.headers.get("content-type")!, /text\/csv/);
  const text = await res.text();
  assert.equal(text.trim().split("\n").length, 51);
});

test("API agents : jeton requis, cycle d'exécution réel, validation non contournable", async () => {
  assert.equal((await register(req("/api/agent/register", { name: "X", positionId: "MKT-01" }))).status, 401);
  process.env.AGENT_API_TOKEN = "jeton-agent-de-test-tres-long-123456";
  process.env.APP_MODE = "connected";
  __resetStore();
  const auth = { authorization: "Bearer jeton-agent-de-test-tres-long-123456" };
  const { agent } = await (await register(req("/api/agent/register", { name: "Agent SEO", positionId: "MKT-05" }, auth))).json();
  const { mission } = await (await createMission(req("/api/missions", { title: "Audit SEO", departmentId: "MKT", positionId: "MKT-05" }))).json();

  // une demande de validation bloque l'exécution
  const apr = await agentApproval(req("/api/agent/approvals", {
    requestedBy: "MKT-05", actionType: "sensitive_publication", description: "Publier", consequences: "Visible publiquement", missionId: mission.id, agentId: agent.id,
  }, auth));
  assert.equal(apr.status, 201);
  assert.equal((await startExe(req("/api/agent/executions", { missionId: mission.id, agentId: agent.id }, auth))).status, 409);
  // l'agent ne peut pas décider lui-même (route fondateur)
  const approvalId = (await apr.json()).approval.id;
  assert.equal((await decide(req(`/api/approvals/${approvalId}`, { decision: "approved" }, auth), params(approvalId))).status, 403);
});

test("API agents : exécution → working → fin", async () => {
  process.env.AGENT_API_TOKEN = "jeton-agent-de-test-tres-long-123456";
  process.env.APP_MODE = "connected";
  __resetStore();
  const auth = { authorization: "Bearer jeton-agent-de-test-tres-long-123456" };
  const { agent } = await (await register(req("/api/agent/register", { name: "Agent social", positionId: "MKT-04" }, auth))).json();
  const { mission } = await (await createMission(req("/api/missions", { title: "Posts", departmentId: "MKT", positionId: "MKT-04" }))).json();
  const started = await startExe(req("/api/agent/executions", { missionId: mission.id, agentId: agent.id }, auth));
  assert.equal(started.status, 201);
  const { execution } = await started.json();
  const snap = (await state().json()).snapshot;
  assert.equal(snap.totals.working, 1);
  assert.equal((await exeAction(req(`/api/agent/executions/${execution.id}`, { agentId: agent.id, action: "heartbeat" }, auth), params(execution.id))).status, 200);
  assert.equal((await exeAction(req(`/api/agent/executions/${execution.id}`, { agentId: agent.id, action: "succeeded", resultSummary: "12 posts" }, auth), params(execution.id))).status, 200);
  assert.equal((await state().json()).snapshot.totals.working, 0);
});
