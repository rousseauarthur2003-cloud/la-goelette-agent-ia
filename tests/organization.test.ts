import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEPARTMENTS, POSITIONS, absoluteDesk, inventoryCsv, positionsOf } from "@/lib/organization";

const EXPECTED: Record<string, number> = { DIR: 4, MKT: 6, COM: 5, SAL: 5, CX: 5, FIN: 5, IT: 5, CUL: 6, OPS: 5, ADM: 4 };

test("exactement 10 départements", () => {
  assert.equal(DEPARTMENTS.length, 10);
  assert.deepEqual(DEPARTMENTS.map((d) => d.id).sort(), Object.keys(EXPECTED).sort());
});

test("exactement 50 postes, identifiants uniques", () => {
  assert.equal(POSITIONS.length, 50);
  assert.equal(new Set(POSITIONS.map((p) => p.id)).size, 50);
});

test("répartition par département conforme au cahier des charges", () => {
  for (const [dept, n] of Object.entries(EXPECTED)) {
    assert.equal(positionsOf(dept).length, n, dept);
    for (const p of positionsOf(dept)) assert.ok(p.id.startsWith(`${dept}-`), `${p.id} rattaché à ${dept}`);
  }
});

test("chaque département a un responsable qui lui appartient", () => {
  for (const d of DEPARTMENTS) {
    const manager = POSITIONS.find((p) => p.id === d.managerPositionId);
    assert.ok(manager && manager.departmentId === d.id, d.id);
  }
});

test("slugs uniques", () => {
  assert.equal(new Set(DEPARTMENTS.map((d) => d.slug)).size, 10);
});

test("chaque bureau (2 tuiles + siège) est à l'intérieur de sa salle, sans chevauchement", () => {
  const used = new Set<string>();
  for (const p of POSITIONS) {
    const d = DEPARTMENTS.find((x) => x.id === p.departmentId)!;
    const { x, y } = absoluteDesk(p);
    // intérieur = hors murs
    assert.ok(x > d.room.x && x + 1 < d.room.x + d.room.width - 1, `${p.id} x`);
    assert.ok(y - 1 > d.room.y && y < d.room.y + d.room.height - 1, `${p.id} y`);
    for (const k of [`${x},${y}`, `${x + 1},${y}`, `${x},${y - 1}`]) {
      assert.ok(!used.has(k), `chevauchement ${p.id}`);
      used.add(k);
    }
  }
});

test("le CEO est au centre du bâtiment", () => {
  const ceo = absoluteDesk(POSITIONS.find((p) => p.id === "DIR-01")!);
  assert.ok(Math.abs(ceo.x - 60) <= 2 && Math.abs(ceo.y - 44) <= 2, JSON.stringify(ceo));
});

test("docs/agents/desk-inventory.csv est synchronisé avec la source de données", () => {
  const file = readFileSync(new URL("../docs/agents/desk-inventory.csv", import.meta.url), "utf8");
  assert.equal(file, inventoryCsv());
  assert.equal(file.trim().split("\n").length, 51);
});
