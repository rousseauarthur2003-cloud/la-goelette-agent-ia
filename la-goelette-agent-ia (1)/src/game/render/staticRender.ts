/**
 * Rendu statique du siège sur un canvas 2D (sans Phaser).
 * Sert à la vérification visuelle automatisée et peut produire une vignette.
 * Utilise exactement les mêmes données (buildMap) et les mêmes dessins que la scène Phaser.
 */
import { TILE } from "@/game/config/constants";
import type { HQMap } from "@/game/maps/buildMap";
import { drawTileset } from "@/game/art/tiles";
import { drawFurniture, type DeskVariant } from "@/game/art/furniture";
import { CEO_LOOK, CHAR_H, CHAR_W, drawCharacterSheet, lookFor } from "@/game/art/characters";
import type { CanvasFactory } from "@/game/art/pixel";
import { getDepartment } from "@/lib/organization";
import type { DeskState } from "@/types/domain";

export function renderStatic(
  make: CanvasFactory,
  map: HQMap,
  deskStates: Record<string, DeskState>,
  scale = 1,
): HTMLCanvasElement {
  const canvas = make(map.width * TILE * scale, map.height * TILE * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);
  const tileset = drawTileset(make);
  for (let y = 0; y < map.height; y++)
    for (let x = 0; x < map.width; x++)
      ctx.drawImage(tileset, map.tiles[y][x] * TILE, 0, TILE, TILE, x * TILE, y * TILE, TILE, TILE);

  const ordered = [...map.furniture].sort((a, b) => (a.type === "rug" ? -1 : 0) - (b.type === "rug" ? -1 : 0) || a.y - b.y);
  for (const f of ordered) {
    const accent = f.departmentId ? getDepartment(f.departmentId)?.color : undefined;
    let variant: DeskVariant = "idle";
    if (f.positionId) {
      const s = deskStates[f.positionId] ?? "vacant";
      variant = s === "working" ? "on" : s === "vacant" ? "empty" : s === "available" ? "idle" : "off";
      if (f.type === "chair" && (s === "working" || s === "available")) continue;
    }
    ctx.drawImage(drawFurniture(make, f.type, f.w, f.h, accent, variant), f.x * TILE, f.y * TILE);
  }

  for (const d of map.desks) {
    const s = deskStates[d.positionId] ?? "vacant";
    if (s !== "working" && s !== "available") continue;
    const accent = getDepartment(d.departmentId)?.color;
    const sheet = drawCharacterSheet(make, d.positionId === "DIR-01" ? CEO_LOOK : lookFor(d.positionId, accent));
    const row = s === "working" ? 4 : 0;
    const px = d.seat.x * TILE + (d.positionId === "DIR-01" ? 0 : TILE / 2) - CHAR_W / 2 + (d.positionId === "DIR-01" ? TILE / 2 : 0);
    const py = (d.seat.y + 1) * TILE - CHAR_H + (s === "working" ? 10 : 0);
    ctx.drawImage(sheet, 0, row * CHAR_H, CHAR_W, CHAR_H, px, py, CHAR_W, CHAR_H);
  }
  return canvas;
}
