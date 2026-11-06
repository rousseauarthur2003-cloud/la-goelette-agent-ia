/**
 * Génération déterministe de la carte du siège (logique pure, sans Phaser).
 * Produit : grille de tuiles, grille de collision, mobilier, portes, zones
 * cliquables et ancrages des bureaux. Testé dans tests/map.test.ts
 * (limites, chevauchements, accessibilité de chaque bureau).
 */
import { MAP_H, MAP_W, T, WALKABLE } from "@/game/config/constants";
import { DEPARTMENTS, POSITIONS, absoluteDesk } from "@/lib/organization";
import type { RoomRect } from "@/types/domain";

export type FurnitureType =
  | "desk" | "ceo_desk" | "chair" | "plant" | "plant_big" | "meeting_table" | "reception"
  | "sofa" | "screen" | "whiteboard" | "bookshelf" | "cabinet" | "server" | "counter"
  | "stove" | "fridge" | "shelves" | "boxes" | "easel" | "cooler" | "printer" | "coffee"
  | "rug" | "trophy" | "safe" | "armchair" | "low_table" | "bench" | "tree" | "flowerbed";

export interface Furniture {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  w: number;
  h: number;
  blocks: boolean;
  departmentId?: string;
  positionId?: string;
}

export interface Zone {
  id: string;
  kind: "department" | "hall" | "meeting";
  label: string;
  rect: RoomRect;
  departmentId?: string;
}

export interface DeskAnchor {
  positionId: string;
  departmentId: string;
  desk: { x: number; y: number }; // tuile gauche du bureau (2×1)
  seat: { x: number; y: number }; // tuile du fauteuil (personnage)
  front: { x: number; y: number }; // tuile d'interaction devant le bureau
}

export interface HQMap {
  width: number;
  height: number;
  tiles: number[][];
  collision: boolean[][];
  furniture: Furniture[];
  zones: Zone[];
  desks: DeskAnchor[];
  doors: Array<{ x: number; y: number }>;
  spawn: { x: number; y: number };
  ceo: DeskAnchor;
  /** Éléments de décor non placés faute de place (diagnostic). */
  skipped: string[];
}

export const HALL: RoomRect = { x: 38, y: 24, width: 44, height: 9 };
export const MEETING: RoomRect = { x: 44, y: 55, width: 32, height: 7 };

export function buildMap(): HQMap {
  const tiles: number[][] = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(T.OUTSIDE));
  const set = (x: number, y: number, t: number) => {
    if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) tiles[y][x] = t;
  };
  const fill = (r: RoomRect, t: number) => {
    for (let y = r.y; y < r.y + r.height; y++) for (let x = r.x; x < r.x + r.width; x++) set(x, y, t);
  };

  // Extérieur : allées devant les entrées.
  for (let y = 26; y <= 30; y++) { set(0, y, T.PATH); set(119, y, T.PATH); }

  // Bâtiment : murs extérieurs avec baies vitrées régulières, couloirs intérieurs.
  fill({ x: 1, y: 1, width: MAP_W - 2, height: MAP_H - 2 }, T.CORRIDOR);
  for (let x = 1; x < MAP_W - 1; x++) {
    const win = x % 6 >= 2 && x % 6 <= 4 && x > 2 && x < MAP_W - 3;
    set(x, 1, win ? T.WINDOW : T.WALL_OUTER);
    set(x, MAP_H - 2, win ? T.WINDOW : T.WALL_OUTER);
  }
  for (let y = 1; y < MAP_H - 1; y++) {
    set(1, y, T.WALL_OUTER);
    set(MAP_W - 2, y, T.WALL_OUTER);
  }
  // Entrées principales (ouest et est) donnant sur le hall.
  const entrances = [27, 28, 29];
  for (const y of entrances) { set(1, y, T.ENTRANCE); set(MAP_W - 2, y, T.ENTRANCE); }

  // Hall d'accueil (zone centrale, sans poste de travail).
  fill(HALL, T.HALL);

  const doors: Array<{ x: number; y: number }> = [];
  const zones: Zone[] = [];

  // Salles des départements.
  DEPARTMENTS.forEach((dept, index) => {
    const r = dept.room;
    fill(r, T.DEPT_FLOOR + index);
    const x0 = r.x, y0 = r.y, x1 = r.x + r.width - 1, y1 = r.y + r.height - 1;
    for (let x = x0; x <= x1; x++) { set(x, y0, T.WALL); set(x, y1, T.WALL); }
    for (let y = y0; y <= y1; y++) { set(x0, y, T.WALL); set(x1, y, T.WALL); }

    const row = r.y < 30 ? 1 : r.y < 60 ? 2 : 3;
    // Cloisons vitrées sur les murs donnant sur les couloirs principaux.
    const glassWalls = row === 1 ? [y1] : row === 2 ? [y0, y1] : [y0];
    for (const gy of glassWalls) {
      for (let x = x0 + 2; x <= x1 - 2; x++) if ((x - x0) % 5 !== 0) set(x, gy, T.GLASS);
    }
    // Portes (2 tuiles) au centre des murs vitrés.
    const cx = x0 + Math.floor(r.width / 2) - 1;
    const doorXs = dept.id === "DIR" ? [x0 + 6, cx, x1 - 7] : [cx];
    for (const gy of glassWalls) {
      for (const dx of doorXs) {
        for (const x of [dx, dx + 1]) { set(x, gy, T.DOOR); doors.push({ x, y: gy }); }
      }
    }
    zones.push({ id: `room-${dept.id}`, kind: "department", label: dept.name, rect: r, departmentId: dept.id });
  });

  // Salle de réunion (zone centrale) : cloisons vitrées, portes en haut et en bas.
  {
    const r = MEETING;
    fill(r, T.MEETING);
    const x0 = r.x, y0 = r.y, x1 = r.x + r.width - 1, y1 = r.y + r.height - 1;
    for (let x = x0; x <= x1; x++) { set(x, y0, (x - x0) % 4 === 0 ? T.WALL : T.GLASS); set(x, y1, (x - x0) % 4 === 0 ? T.WALL : T.GLASS); }
    for (let y = y0; y <= y1; y++) { set(x0, y, T.WALL); set(x1, y, T.WALL); }
    for (const dx of [x0 + 5, x1 - 6]) for (const x of [dx, dx + 1]) for (const y of [y0, y1]) { set(x, y, T.DOOR); doors.push({ x, y }); }
    zones.push({ id: "meeting", kind: "meeting", label: "Salle de réunion", rect: r });
  }
  zones.push({ id: "hall", kind: "hall", label: "Hall d'accueil", rect: HALL });

  // ------------------------------------------------------------------
  // Mobilier
  // ------------------------------------------------------------------
  const furniture: Furniture[] = [];
  const occupied = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  const reserved = new Set<string>();
  let fid = 0;
  const skipped: string[] = [];

  const canPlace = (x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) {
        if (!WALKABLE.has(tiles[yy]?.[xx] ?? -1)) return false;
        if (tiles[yy][xx] === T.DOOR || tiles[yy][xx] === T.ENTRANCE) return false;
        if (occupied.has(key(xx, yy)) || reserved.has(key(xx, yy))) return false;
      }
    return true;
  };
  const place = (f: Omit<Furniture, "id">, force = false): boolean => {
    if (!force && f.blocks && !canPlace(f.x, f.y, f.w, f.h)) {
      skipped.push(`${f.type}@${f.x},${f.y}`);
      return false;
    }
    furniture.push({ ...f, id: `F${++fid}` });
    if (f.blocks) for (let yy = f.y; yy < f.y + f.h; yy++) for (let xx = f.x; xx < f.x + f.w; xx++) occupied.add(key(xx, yy));
    return true;
  };

  // Les abords des portes restent dégagés (2 tuiles de chaque côté).
  for (const d of doors) for (let dy = -2; dy <= 2; dy++) reserved.add(key(d.x, d.y + dy));

  // Bureaux : un bureau 2×1, un fauteuil au-dessus, une tuile d'interaction devant.
  const desks: DeskAnchor[] = POSITIONS.map((p) => {
    const { x, y } = absoluteDesk(p);
    const isCeo = p.id === "DIR-01";
    const anchor: DeskAnchor = {
      positionId: p.id,
      departmentId: p.departmentId,
      desk: { x, y },
      seat: { x, y: y - 1 },
      front: { x, y: y + 1 },
    };
    place({ type: isCeo ? "ceo_desk" : "desk", x: isCeo ? x - 1 : x, y, w: isCeo ? 4 : 2, h: 1, blocks: true, departmentId: p.departmentId, positionId: p.id }, true);
    place({ type: "chair", x, y: y - 1, w: 1, h: 1, blocks: true, departmentId: p.departmentId, positionId: p.id }, true);
    reserved.add(key(x, y + 1));
    reserved.add(key(x + 1, y + 1));
    return anchor;
  });

  // Décor commun et spécifique par département (coordonnées locales).
  const DECOR: Record<string, Array<[FurnitureType, number, number, number, number, boolean?]>> = {
    MKT: [["whiteboard", 3, 1, 3, 1], ["screen", 15, 1, 4, 1], ["low_table", 10, 2, 3, 2], ["armchair", 9, 2, 1, 1], ["armchair", 13, 2, 1, 1]],
    COM: [["easel", 3, 2, 1, 1], ["easel", 5, 2, 1, 1], ["bookshelf", 16, 1, 3, 1], ["screen", 9, 1, 4, 1], ["rug", 9, 3, 5, 2, false]],
    SAL: [["trophy", 4, 1, 1, 1], ["screen", 9, 1, 4, 1], ["sofa", 16, 2, 3, 1], ["low_table", 16, 3, 3, 1]],
    CX: [["sofa", 3, 2, 3, 1], ["low_table", 3, 3, 3, 1], ["screen", 10, 1, 4, 1], ["coffee", 18, 1, 1, 1]],
    FIN: [["cabinet", 3, 1, 2, 1], ["cabinet", 5, 1, 2, 1], ["screen", 16, 1, 3, 1], ["safe", 19, 1, 2, 1]],
    IT: [["server", 3, 1, 1, 1], ["server", 4, 1, 1, 1], ["server", 5, 1, 1, 1], ["server", 6, 1, 1, 1], ["screen", 13, 1, 4, 1], ["printer", 19, 1, 1, 1]],
    CUL: [["counter", 26, 2, 6, 1], ["stove", 26, 5, 2, 1], ["stove", 28, 5, 2, 1], ["counter", 26, 9, 6, 1], ["fridge", 32, 2, 1, 2], ["shelves", 26, 14, 6, 1], ["bookshelf", 3, 2, 3, 1]],
    OPS: [["shelves", 26, 4, 6, 1], ["shelves", 26, 7, 6, 1], ["boxes", 27, 11, 2, 2], ["boxes", 30, 11, 2, 2], ["shelves", 26, 16, 6, 1], ["screen", 4, 2, 4, 1]],
    ADM: [["bookshelf", 3, 2, 3, 1], ["cabinet", 25, 3, 2, 1], ["cabinet", 25, 5, 2, 1], ["cabinet", 28, 3, 2, 1], ["low_table", 25, 11, 4, 2], ["armchair", 24, 11, 1, 1], ["armchair", 29, 11, 1, 1], ["bookshelf", 25, 16, 4, 1]],
    DIR: [["meeting_table", 36, 12, 7, 3], ["screen", 8, 1, 6, 1], ["bookshelf", 3, 2, 3, 1], ["sofa", 48, 2, 3, 1], ["low_table", 48, 3, 3, 1], ["plant_big", 21, 7, 1, 1], ["plant_big", 33, 7, 1, 1], ["rug", 23, 7, 9, 5, false]],
  };

  for (const dept of DEPARTMENTS) {
    const r = dept.room;
    // Rugs first (non bloquants, sous le mobilier).
    for (const [type, lx, ly, w, h, blocks = true] of DECOR[dept.id] ?? []) {
      place({ type, x: r.x + lx, y: r.y + ly, w, h, blocks, departmentId: dept.id });
    }
    // Tapis délimitant les rangées de bureaux (non bloquants).
    const rows = [...new Set(POSITIONS.filter((p) => p.departmentId === dept.id).map((p) => p.deskLocal.y))];
    const xs = POSITIONS.filter((p) => p.departmentId === dept.id && dept.id !== "DIR").map((p) => p.deskLocal.x);
    if (xs.length) {
      const minX = Math.min(...xs) - 2, maxX = Math.max(...xs) + 4;
      for (const ry of rows) place({ type: "rug", x: r.x + minX, y: r.y + ry - 2, w: maxX - minX, h: 4, blocks: false, departmentId: dept.id });
    }
    // Coin détente et équipements le long des murs latéraux.
    const midY = Math.floor(r.height / 2);
    place({ type: "plant_big", x: r.x + 1, y: r.y + midY, w: 1, h: 1, blocks: true, departmentId: dept.id });
    place({ type: "plant_big", x: r.x + r.width - 2, y: r.y + midY, w: 1, h: 1, blocks: true, departmentId: dept.id });
    if (dept.id !== "CUL" && dept.id !== "OPS" && dept.id !== "ADM") {
      place({ type: "bookshelf", x: r.x + r.width - 5, y: r.y + r.height - 3, w: 3, h: 1, blocks: true, departmentId: dept.id });
      place({ type: "printer", x: r.x + 3, y: r.y + r.height - 3, w: 1, h: 1, blocks: true, departmentId: dept.id });
    }
    // Plantes dans les angles et fontaine à eau.
    const corners: Array<[number, number]> = [[1, 1], [r.width - 2, 1], [1, r.height - 2], [r.width - 2, r.height - 2]];
    for (const [lx, ly] of corners) place({ type: "plant", x: r.x + lx, y: r.y + ly, w: 1, h: 1, blocks: true, departmentId: dept.id });
    place({ type: "cooler", x: r.x + r.width - 3, y: r.y + 1, w: 1, h: 1, blocks: true, departmentId: dept.id });
  }

  // Hall d'accueil.
  place({ type: "rug", x: 52, y: 26, w: 16, h: 5, blocks: false, departmentId: "MKT" });
  place({ type: "reception", x: 56, y: 25, w: 8, h: 1, blocks: true });
  for (const x of [41, 45]) { place({ type: "sofa", x, y: 25, w: 3, h: 1, blocks: true }); place({ type: "low_table", x, y: 26, w: 3, h: 1, blocks: true }); }
  for (const x of [72, 76]) { place({ type: "sofa", x, y: 25, w: 3, h: 1, blocks: true }); place({ type: "low_table", x, y: 26, w: 3, h: 1, blocks: true }); }
  for (const [x, y] of [[39, 25], [80, 25], [39, 31], [80, 31], [50, 25], [69, 25]] as Array<[number, number]>) {
    place({ type: "plant_big", x, y, w: 1, h: 1, blocks: true });
  }
  place({ type: "coffee", x: 50, y: 31, w: 1, h: 1, blocks: true });
  place({ type: "cooler", x: 69, y: 31, w: 1, h: 1, blocks: true });

  // Salle de réunion.
  place({ type: "meeting_table", x: 52, y: 57, w: 16, h: 3, blocks: true });
  place({ type: "screen", x: 57, y: 56, w: 6, h: 1, blocks: false });
  place({ type: "plant", x: 45, y: 56, w: 1, h: 1, blocks: true });
  place({ type: "plant", x: 74, y: 60, w: 1, h: 1, blocks: true });

  // Plantes de couloir le long des murs extérieurs.
  for (let x = 6; x < MAP_W - 6; x += 9) {
    place({ type: "plant", x, y: 2, w: 1, h: 1, blocks: true });
  }
  // Extérieur : massifs fleuris et arbres autour des entrées.
  for (const y of [24, 32]) { place({ type: "flowerbed", x: 0, y, w: 1, h: 1, blocks: true }); place({ type: "flowerbed", x: 119, y, w: 1, h: 1, blocks: true }); }

  // ------------------------------------------------------------------
  // Collision
  // ------------------------------------------------------------------
  const collision = tiles.map((row) => row.map((t) => !WALKABLE.has(t)));
  for (const f of furniture) {
    if (!f.blocks) continue;
    for (let yy = f.y; yy < f.y + f.h; yy++) for (let xx = f.x; xx < f.x + f.w; xx++) collision[yy][xx] = true;
  }
  // La bordure extérieure de la carte est infranchissable sauf devant les entrées.
  for (let x = 0; x < MAP_W; x++) { collision[0][x] = true; collision[MAP_H - 1][x] = true; }
  for (let y = 0; y < MAP_H; y++) {
    if (!entrances.includes(y) && !(y >= 26 && y <= 30)) { collision[y][0] = true; collision[y][MAP_W - 1] = true; }
  }

  const ceo = desks.find((d) => d.positionId === "DIR-01")!;
  return { width: MAP_W, height: MAP_H, tiles, collision, furniture, zones, desks, doors, spawn: { x: 60, y: 29 }, ceo, skipped };
}

/** Accessibilité (BFS 4 directions) depuis un point. */
export function reachableFrom(map: HQMap, start: { x: number; y: number }): boolean[][] {
  const seen = map.collision.map((row) => row.map(() => false));
  const queue: Array<[number, number]> = [[start.x, start.y]];
  seen[start.y][start.x] = true;
  while (queue.length) {
    const [x, y] = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
      if (seen[ny][nx] || map.collision[ny][nx]) continue;
      seen[ny][nx] = true;
      queue.push([nx, ny]);
    }
  }
  return seen;
}

export function zoneAt(map: HQMap, x: number, y: number): Zone | null {
  // Les salles priment sur le hall.
  const ordered = [...map.zones].sort((a, b) => (a.kind === "hall" ? 1 : 0) - (b.kind === "hall" ? 1 : 0));
  return ordered.find((z) => x >= z.rect.x && y >= z.rect.y && x < z.rect.x + z.rect.width && y < z.rect.y + z.rect.height) ?? null;
}
