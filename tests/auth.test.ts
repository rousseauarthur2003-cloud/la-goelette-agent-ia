import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPassword, createSessionToken, verifySessionToken, isAgentRequest } from "@/server/auth";

test("sans mot de passe configuré : aucune session possible", async () => {
  delete process.env.FOUNDER_PASSWORD;
  assert.equal(await createSessionToken(), null);
  assert.equal(await verifySessionToken("founder.9999999999.abc"), false);
});

test("session signée : valide, falsifiée, expirée", async () => {
  process.env.FOUNDER_PASSWORD = "mot-de-passe-test";
  process.env.AUTH_SECRET = "secret-de-test-suffisamment-long";
  const token = (await createSessionToken())!;
  assert.equal(await verifySessionToken(token), true);
  assert.equal(await verifySessionToken(token.replace(/.$/, (c) => (c === "a" ? "b" : "a"))), false);
  const [, exp] = token.split(".");
  assert.equal(await verifySessionToken(token, (Number(exp) + 1) * 1000), false);
  process.env.AUTH_SECRET = "un-autre-secret-tout-aussi-long";
  assert.equal(await verifySessionToken(token), false, "changement de secret = sessions invalidées");
});

test("vérification du mot de passe", async () => {
  process.env.FOUNDER_PASSWORD = "mot-de-passe-test";
  assert.equal(await checkPassword("mot-de-passe-test"), true);
  assert.equal(await checkPassword("mauvais"), false);
});

test("API agents : jeton obligatoire et suffisamment long", () => {
  process.env.AGENT_API_TOKEN = "court";
  assert.equal(isAgentRequest(new Request("http://x", { headers: { authorization: "Bearer court" } })), false);
  process.env.AGENT_API_TOKEN = "jeton-agent-de-test-tres-long-123456";
  assert.equal(isAgentRequest(new Request("http://x", { headers: { authorization: "Bearer jeton-agent-de-test-tres-long-123456" } })), true);
  assert.equal(isAgentRequest(new Request("http://x", { headers: { authorization: "Bearer faux" } })), false);
  assert.equal(isAgentRequest(new Request("http://x")), false);
});
