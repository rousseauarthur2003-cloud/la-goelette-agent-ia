import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMap, reachableFrom, zoneAt } from "@/game/maps/buildMap";
import { MAP_H, MAP_W, T } from "@/game/config/constants";
import { DEPARTMENTS } from "@/lib/organization";

const map = buildMap();
const reach = reachableFrom(map, map.spawn);

test("carte 120 × 88 tuiles", () => {
  assert.equal(map.tiles.length, MAP_H);
  assert.ok(map.tiles.every((r) => r.length === MAP_W));
  assert.equal(MAP_W * 32, 3840);
  assert.equal(MAP_H * 32, 2816);
});

test("les salles ne se chevauchent pas et restent dans le bâtiment", () => {
  for (const a of DEPARTMENTS) {
    const r = a.room;
    assert.ok(r.x >= 2 && r.y >= 2 && r.x + r.width <= MAP_W - 2 && r.y + r.height <= MAP_H - 2, a.id);
    for (const b of DEPARTMENTS) {
      if (a === b) continue;
      const o = !(r.x + r.width <= b.room.x || b.room.x + b.room.width <= r.x || r.y + r.height <= b.room.y || b.room.y + b.room.height <= r.y);
      assert.equal(o, false, `${a.id} chevauche ${b.id}`);
    }
  }
});

test("50 bureaux avec ancrage unique", () => {
  assert.equal(map.desks.length, 50);
  assert.equal(new Set(map.desks.map((d) => `${d.desk.x},${d.desk.y}`)).size, 50);
});

test("chaque bureau est accessible à pied depuis le hall", () => {
  for (const d of map.desks) {
    assert.equal(map.collision[d.front.y][d.front.x], false, `${d.positionId} : devant bloqué`);
    assert.ok(reach[d.front.y][d.front.x], `${d.positionId} inaccessible`);
  }
});

test("chaque salle a au moins une porte accessible", () => {
  for (const dept of DEPARTMENTS) {
    const r = dept.room;
    const doors = map.doors.filter((d) => d.x >= r.x && d.x < r.x + r.width && d.y >= r.y && d.y < r.y + r.height);
    assert.ok(doors.length >= 2, dept.id);
    assert.ok(doors.some((d) => reach[d.y][d.x]), `${dept.id} : porte inaccessible`);
  }
});

test("murs et vitres bloquent, portes passent", () => {
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const t = map.tiles[y][x];
    if (t === T.WALL || t === T.GLASS || t === T.WALL_OUTER || t === T.WINDOW) assert.ok(map.collision[y][x]);
  }
  for (const d of map.doors) assert.equal(map.collision[d.y][d.x], false);
});

test("aucun meuble hors carte ni sur une porte", () => {
  const doorKeys = new Set(map.doors.map((d) => `${d.x},${d.y}`));
  for (const f of map.furniture) {
    assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= MAP_W && f.y + f.h <= MAP_H, f.id);
    if (!f.blocks) continue;
    for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) assert.ok(!doorKeys.has(`${x},${y}`), `${f.type} sur porte`);
  }
});

test("tout le décor prévu est placé", () => {
  assert.deepEqual(map.skipped, []);
});

test("le CEO est dans la direction, au centre ; le point d'apparition est dans le hall", () => {
  assert.equal(zoneAt(map, map.ceo.desk.x, map.ceo.desk.y)?.departmentId, "DIR");
  assert.equal(zoneAt(map, map.spawn.x, map.spawn.y)?.kind, "hall");
  assert.equal(map.collision[map.spawn.y][map.spawn.x], false);
});
