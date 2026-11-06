import { TILE, TILE_COUNT, T, PALETTE } from "@/game/config/constants";
import { DEPARTMENTS } from "@/lib/organization";
import { Pen, rng, shade, type CanvasFactory } from "./pixel";

/** Dessine le tileset complet (une rangée de tuiles 32×32). */
export function drawTileset(make: CanvasFactory): HTMLCanvasElement {
  const canvas = make(TILE * TILE_COUNT, TILE);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < TILE_COUNT; i++) drawTile(new Pen(ctx, i * TILE, 0), i);
  return canvas;
}

function drawTile(pen: Pen, index: number) {
  switch (index) {
    case T.OUTSIDE: return grass(pen);
    case T.PATH: return paving(pen, "#D9D2C3", "#C3BAA8");
    case T.CORRIDOR: return stoneFloor(pen);
    case T.WALL: return wall(pen, "#C8BFAE", "#DDD5C6", "#7E7464");
    case T.WALL_OUTER: return wall(pen, PALETTE.navy, shade(PALETTE.navy, 0.18), shade(PALETTE.navy, -0.35));
    case T.GLASS: return glass(pen);
    case T.WINDOW: return windowTile(pen);
    case T.DOOR: return door(pen);
    case T.ENTRANCE: return entrance(pen);
    case T.HALL: return parquet(pen, PALETTE.wood);
    case T.MEETING: return carpet(pen, "#A8B6C2", "#97A7B5");
    default: {
      const dept = DEPARTMENTS[index - T.DEPT_FLOOR];
      if (dept) return dept.id === "CUL" ? kitchenFloor(pen) : carpet(pen, dept.floorColor, shade(dept.floorColor, -0.05));
    }
  }
}

function grass(pen: Pen) {
  pen.r(0, 0, 16, 16, "#A9C196");
  const rand = rng(7);
  for (let i = 0; i < 14; i++) pen.p(Math.floor(rand() * 16), Math.floor(rand() * 16), rand() > 0.5 ? "#97B184" : "#B8CDA6");
}

function paving(pen: Pen, base: string, joint: string) {
  pen.r(0, 0, 16, 16, base);
  pen.r(0, 7, 16, 1, joint);
  pen.r(0, 15, 16, 1, joint);
  pen.r(5, 0, 1, 7, joint);
  pen.r(12, 8, 1, 7, joint);
}

function stoneFloor(pen: Pen) {
  pen.r(0, 0, 16, 16, PALETTE.offWhite);
  pen.r(0, 15, 16, 1, "#D7D0C2");
  pen.r(15, 0, 1, 16, "#D7D0C2");
  pen.r(0, 0, 16, 1, "#EEEAE2");
  pen.p(4, 5, "#DDD6C9");
  pen.p(11, 10, "#DDD6C9");
}

function wall(pen: Pen, top: string, mid: string, dark: string) {
  pen.r(0, 0, 16, 16, top);
  pen.r(0, 0, 16, 1, mid);
  pen.r(0, 15, 16, 1, dark);
  pen.r(0, 13, 16, 2, mid);
  pen.p(3, 6, shade(top, -0.04));
  pen.p(10, 4, shade(top, -0.04));
}

function glass(pen: Pen) {
  stoneFloor(pen);
  pen.r(0, 5, 16, 6, "#5E7385");
  pen.r(0, 6, 16, 4, "#B9D6EC");
  pen.r(1, 6, 3, 1, "#E8F3FB");
  pen.r(9, 8, 4, 1, "#E8F3FB");
  pen.r(0, 9, 16, 1, "#9CC1DE");
}

function windowTile(pen: Pen) {
  wall(pen, PALETTE.navy, shade(PALETTE.navy, 0.18), shade(PALETTE.navy, -0.35));
  pen.r(1, 4, 14, 8, "#36506F");
  pen.r(2, 5, 12, 6, PALETTE.lightBlue);
  pen.r(3, 6, 4, 1, "#D6E8F6");
  pen.r(9, 8, 3, 1, "#D6E8F6");
}

function door(pen: Pen) {
  stoneFloor(pen);
  pen.r(0, 4, 16, 8, shade(PALETTE.wood, -0.1));
  pen.r(1, 5, 14, 6, PALETTE.wood);
  for (let x = 2; x < 15; x += 3) pen.r(x, 5, 1, 6, shade(PALETTE.wood, -0.15));
}

function entrance(pen: Pen) {
  paving(pen, "#D9D2C3", "#C3BAA8");
  pen.r(0, 0, 16, 16, "#7C95AA");
  pen.r(1, 1, 14, 14, "#9FC2DF");
  pen.r(7, 1, 2, 14, "#7C95AA");
  pen.r(2, 3, 3, 1, "#E3F0FA");
  pen.r(10, 9, 3, 1, "#E3F0FA");
}

function parquet(pen: Pen, color: string) {
  pen.r(0, 0, 16, 16, color);
  const dark = shade(color, -0.12);
  const light = shade(color, 0.1);
  for (let y = 0; y < 16; y += 4) {
    pen.r(0, y + 3, 16, 1, dark);
    pen.r(((y / 4) % 2) * 8 + 3, y, 1, 3, dark);
    pen.r(0, y, 16, 1, light);
  }
}

function carpet(pen: Pen, a: string, b: string) {
  pen.r(0, 0, 16, 16, a);
  for (let y = 0; y < 16; y += 2) for (let x = (y / 2) % 2; x < 16; x += 2) pen.p(x, y, b);
  pen.r(0, 15, 16, 1, shade(a, -0.06));
}

function kitchenFloor(pen: Pen) {
  for (let y = 0; y < 2; y++)
    for (let x = 0; x < 2; x++) pen.r(x * 8, y * 8, 8, 8, (x + y) % 2 === 0 ? "#EDEAE3" : "#C9D3C2");
}
