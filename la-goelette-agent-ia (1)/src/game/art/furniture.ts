import { TILE, PALETTE } from "@/game/config/constants";
import type { FurnitureType } from "@/game/maps/buildMap";
import { Pen, rng, shade, type CanvasFactory } from "./pixel";

export type DeskVariant = "on" | "idle" | "off" | "empty";

const OUT = "#3A3A44";
const WOOD = PALETTE.wood;
const WOOD_D = shade(PALETTE.wood, -0.22);

/** Dessine un meuble sur un canvas de w×h tuiles. */
export function drawFurniture(
  make: CanvasFactory,
  type: FurnitureType,
  w: number,
  h: number,
  accent: string = PALETTE.blueGray,
  variant: DeskVariant = "idle",
): HTMLCanvasElement {
  const canvas = make(w * TILE, h * TILE);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const pen = new Pen(ctx);
  const W = w * 16, H = h * 16;
  const fn = PAINTERS[type];
  fn?.(pen, W, H, accent, variant);
  return canvas;
}

type Painter = (pen: Pen, W: number, H: number, accent: string, variant: DeskVariant) => void;

function monitor(pen: Pen, x: number, y: number, state: DeskVariant) {
  pen.r(x, y, 10, 6, OUT);
  const screen = state === "on" ? "#7FD0A8" : state === "idle" ? "#9CC4E4" : "#2B3440";
  pen.r(x + 1, y + 1, 8, 4, screen);
  if (state === "on") {
    pen.r(x + 2, y + 2, 5, 1, "#E9FFF4");
    pen.r(x + 2, y + 3, 3, 1, "#E9FFF4");
  } else if (state === "idle") {
    pen.r(x + 2, y + 2, 2, 1, "#E4F1FB");
  }
  pen.r(x + 4, y + 6, 2, 1, OUT);
}

const desk: Painter = (pen, W, _H, accent, variant) => {
  pen.r(0, 3, W, 11, OUT);
  pen.r(1, 4, W - 2, 9, WOOD);
  pen.r(1, 4, W - 2, 1, shade(WOOD, 0.2));
  pen.r(1, 12, W - 2, 1, WOOD_D);
  pen.r(2, 14, 2, 2, OUT);
  pen.r(W - 4, 14, 2, 2, OUT);
  if (variant === "empty") {
    pen.r(W / 2 - 3, 7, 6, 3, shade(WOOD, -0.08));
    return;
  }
  monitor(pen, 5, 4, variant);
  pen.r(17, 9, 8, 2, "#E6E3DD"); // clavier
  pen.r(17, 9, 8, 1, "#CFCBC4");
  pen.r(26, 8, 3, 3, accent); // tapis de souris
  pen.p(27, 9, "#F4F2EE");
  pen.r(2, 9, 2, 2, "#F5F3EE"); // tasse
  pen.p(4, 9, "#F5F3EE");
  pen.r(20, 5, 6, 3, "#FBFAF6"); // papiers
  pen.r(21, 6, 4, 1, "#C7C2B8");
};

const ceoDesk: Painter = (pen, W, _H, _a, variant) => {
  pen.r(0, 2, W, 13, OUT);
  pen.r(1, 3, W - 2, 11, "#8C6A43");
  pen.r(1, 3, W - 2, 1, "#A88459");
  pen.r(1, 13, W - 2, 1, "#6E5233");
  const v = variant === "empty" ? "off" : variant;
  monitor(pen, 14, 3, v);
  monitor(pen, 26, 3, v);
  pen.r(20, 10, 12, 2, "#E6E3DD");
  pen.r(4, 5, 6, 6, "#F2EFE8");
  pen.r(5, 6, 4, 1, PALETTE.navy);
  pen.r(5, 8, 3, 1, "#B8B2A8");
  pen.disc(56, 8, 3, "#5E8F5A");
  pen.r(55, 10, 3, 3, "#C9785E");
  pen.r(44, 6, 4, 4, PALETTE.yellow); // trophée de cap
  pen.r(45, 10, 2, 2, "#B88A2E");
};

const chair: Painter = (pen) => {
  pen.r(4, 1, 8, 4, OUT);
  pen.r(5, 2, 6, 2, "#4B5563");
  pen.disc(8, 9, 5, OUT);
  pen.disc(8, 9, 4, "#5B6573");
  pen.r(6, 7, 4, 1, "#6E7987");
  pen.r(7, 14, 2, 2, OUT);
};

const plant: Painter = (pen, W, H) => {
  const cx = W / 2, cy = H / 2;
  pen.r(cx - 4, cy + 1, 8, 6, OUT);
  pen.r(cx - 3, cy + 2, 6, 4, "#E9E4DA");
  pen.disc(cx, cy - 1, 5, "#3F6B45");
  pen.disc(cx - 2, cy - 2, 3, "#5E8F5A");
  pen.disc(cx + 2, cy, 3, "#6FA067");
  pen.p(cx - 1, cy - 4, "#9CC48F");
  pen.p(cx + 3, cy - 1, "#9CC48F");
};

const plantBig: Painter = (pen, W, H) => {
  const cx = W / 2, cy = H / 2;
  pen.r(cx - 5, cy + 3, 10, 5, OUT);
  pen.r(cx - 4, cy + 4, 8, 3, "#C9785E");
  pen.disc(cx, cy - 1, 7, "#2F5A37");
  pen.disc(cx - 3, cy - 3, 4, "#4E8550");
  pen.disc(cx + 3, cy - 1, 4, "#5E9A5E");
  pen.disc(cx, cy + 1, 3, "#6FA067");
  pen.p(cx - 3, cy - 5, "#A8D19A");
  pen.p(cx + 4, cy - 2, "#A8D19A");
};

const meetingTable: Painter = (pen, W, H) => {
  const chairs = (x: number, y: number) => { pen.r(x, y, 5, 4, OUT); pen.r(x + 1, y + 1, 3, 2, "#5B6573"); };
  for (let x = 6; x < W - 8; x += 9) { chairs(x, 0); chairs(x, H - 4); }
  pen.r(2, 4, W - 4, H - 8, OUT);
  pen.r(3, 5, W - 6, H - 10, "#E2CFA3");
  pen.r(3, 5, W - 6, 1, "#F0E2C2");
  for (let x = 8; x < W - 10; x += 12) { pen.r(x, H / 2 - 2, 5, 3, "#FBFAF6"); pen.r(x + 6, H / 2 - 1, 2, 2, "#F5F3EE"); }
};

const reception: Painter = (pen, W) => {
  pen.r(0, 2, W, 13, OUT);
  pen.r(1, 3, W - 2, 11, PALETTE.navy);
  pen.r(1, 3, W - 2, 3, WOOD);
  pen.r(1, 3, W - 2, 1, shade(WOOD, 0.2));
  pen.r(W / 2 - 14, 8, 28, 3, shade(PALETTE.navy, 0.25));
  // nom de l'entreprise en pixels (simple bande lumineuse, pas un logo)
  pen.r(W / 2 - 12, 9, 24, 1, PALETTE.yellow);
  monitor(pen, 10, 3, "idle");
  pen.disc(W - 10, 6, 3, "#5E8F5A");
};

const sofa: Painter = (pen, W, _H, accent) => {
  const c = accent === PALETTE.blueGray ? PALETTE.coral : accent;
  pen.r(0, 2, W, 12, OUT);
  pen.r(1, 3, W - 2, 10, shade(c, -0.2));
  pen.r(3, 6, W - 6, 6, c);
  for (let x = 3; x < W - 4; x += Math.floor((W - 6) / 3)) pen.r(x, 6, 1, 6, shade(c, -0.15));
  pen.r(3, 6, W - 6, 1, shade(c, 0.2));
};

const armchair: Painter = (pen, _W, _H, accent) => {
  const c = accent === PALETTE.blueGray ? PALETTE.lightBlue : accent;
  pen.r(1, 2, 14, 12, OUT);
  pen.r(2, 3, 12, 10, shade(c, -0.2));
  pen.r(4, 6, 8, 6, c);
};

const lowTable: Painter = (pen, W, H) => {
  pen.r(1, 2, W - 2, H - 4, OUT);
  pen.r(2, 3, W - 4, H - 6, shade(WOOD, 0.1));
  pen.r(4, 5, 4, 3, "#FBFAF6");
  pen.r(W - 8, 5, 3, 3, "#F2C46B");
};

const screen: Painter = (pen, W, _H, accent) => {
  pen.r(0, 0, W, 9, OUT);
  pen.r(1, 1, W - 2, 7, "#1E2A38");
  const rand = rng(W * 31);
  for (let x = 3; x < W - 3; x += 3) {
    const h = 1 + Math.floor(rand() * 5);
    pen.r(x, 7 - h, 2, h, rand() > 0.5 ? accent : PALETTE.lightBlue);
  }
};

const whiteboard: Painter = (pen, W) => {
  pen.r(0, 0, W, 10, "#9AA3AB");
  pen.r(1, 1, W - 2, 8, "#FBFBF8");
  pen.r(4, 3, 10, 1, PALETTE.coral);
  pen.r(4, 5, 16, 1, "#4F7CA3");
  pen.r(4, 7, 8, 1, "#5E8F5A");
  pen.r(W - 12, 3, 7, 5, PALETTE.yellow);
};

const bookshelf: Painter = (pen, W) => {
  pen.r(0, 0, W, 14, OUT);
  pen.r(1, 1, W - 2, 12, WOOD_D);
  const colors = [PALETTE.coral, PALETTE.navy, PALETTE.yellow, "#5E8F5A", PALETTE.lightBlue, "#8C7FA3", "#F2EFE8"];
  const rand = rng(W * 7);
  for (const y of [2, 8]) {
    let x = 2;
    while (x < W - 3) {
      const bw = 1 + Math.floor(rand() * 2);
      pen.r(x, y, bw, 4, colors[Math.floor(rand() * colors.length)]);
      x += bw + (rand() > 0.8 ? 1 : 0);
    }
    pen.r(1, y + 4, W - 2, 1, shade(WOOD_D, -0.2));
  }
};

const cabinet: Painter = (pen, W) => {
  pen.r(0, 1, W, 14, OUT);
  pen.r(1, 2, W - 2, 12, "#B7BEC5");
  for (const y of [3, 7, 11]) { pen.r(2, y, W - 4, 3, "#CDD3D8"); pen.r(W / 2 - 2, y + 1, 4, 1, OUT); }
};

const server: Painter = (pen) => {
  pen.r(1, 0, 14, 16, OUT);
  pen.r(2, 1, 12, 14, "#2B3440");
  for (let y = 2; y < 14; y += 3) {
    pen.r(3, y, 10, 2, "#3D4856");
    pen.p(4, y, "#7FD0A8");
    pen.p(6, y, y % 2 ? PALETTE.yellow : "#7FD0A8");
  }
};

const counter: Painter = (pen, W) => {
  pen.r(0, 1, W, 14, OUT);
  pen.r(1, 2, W - 2, 12, "#C9CED3");
  pen.r(1, 2, W - 2, 1, "#E4E8EB");
  pen.r(6, 5, 10, 7, "#D9B98A"); // planche
  pen.disc(10, 8, 2, "#D9583F"); // tomate
  pen.r(13, 7, 2, 3, "#5E8F5A");
  pen.r(W - 20, 4, 8, 8, "#9AA3AB"); // évier
  pen.r(W - 19, 5, 6, 6, "#7D8891");
  pen.disc(W - 8, 8, 3, "#F3E6C4"); // bol
};

const stove: Painter = (pen, W) => {
  pen.r(0, 1, W, 14, OUT);
  pen.r(1, 2, W - 2, 12, "#3B3F46");
  pen.disc(8, 8, 4, "#5B606A");
  pen.disc(8, 8, 2, "#D97868");
  pen.disc(W - 8, 8, 4, "#5B606A");
  pen.r(W - 13, 5, 10, 7, "#B7BEC5"); // casserole
  pen.r(W - 12, 6, 8, 5, "#E8C77F");
};

const fridge: Painter = (pen, W, H) => {
  pen.r(0, 0, W, H, OUT);
  pen.r(1, 1, W - 2, H - 2, "#E8ECEF");
  pen.r(1, H / 2 - 4, W - 2, 1, "#AEB6BD");
  pen.r(W - 4, 4, 1, 6, "#8A939B");
};

const shelves: Painter = (pen, W) => {
  pen.r(0, 2, W, 12, OUT);
  pen.r(1, 3, W - 2, 10, WOOD);
  const rand = rng(W * 13);
  for (let x = 2; x < W - 4; x += 5) {
    const c = rand() > 0.5 ? "#C9A06A" : rand() > 0.5 ? "#E9E4DA" : "#B8C7B0";
    pen.r(x, 4, 4, 4, c);
    pen.r(x, 9, 4, 3, shade(c, -0.1));
  }
};

const boxes: Painter = (pen, W, H) => {
  const box = (x: number, y: number, s: number) => {
    pen.r(x, y, s, s, OUT);
    pen.r(x + 1, y + 1, s - 2, s - 2, "#C9A06A");
    pen.r(x + 1, y + s / 2, s - 2, 1, "#A57F4D");
  };
  box(1, 1, 14);
  box(W - 15, 4, 12);
  box(6, H - 14, 12);
};

const easel: Painter = (pen) => {
  pen.r(3, 1, 10, 9, OUT);
  pen.r(4, 2, 8, 7, "#FBFAF6");
  pen.r(5, 4, 3, 2, PALETTE.coral);
  pen.r(8, 5, 3, 2, PALETTE.lightBlue);
  pen.r(4, 10, 1, 5, WOOD_D);
  pen.r(11, 10, 1, 5, WOOD_D);
};

const cooler: Painter = (pen) => {
  pen.r(4, 6, 8, 9, OUT);
  pen.r(5, 7, 6, 7, "#E8ECEF");
  pen.disc(8, 4, 3, "#5E93C2");
  pen.disc(8, 4, 2, "#9CC4E4");
};

const printer: Painter = (pen) => {
  pen.r(1, 3, 14, 10, OUT);
  pen.r(2, 4, 12, 8, "#D5D9DD");
  pen.r(4, 2, 8, 3, "#FBFAF6");
  pen.p(12, 9, "#7FD0A8");
};

const coffee: Painter = (pen) => {
  pen.r(3, 2, 10, 12, OUT);
  pen.r(4, 3, 8, 10, "#3B3F46");
  pen.r(5, 4, 6, 3, "#5B606A");
  pen.r(6, 9, 4, 3, "#F5F3EE");
  pen.p(10, 5, PALETTE.coral);
};

const rug: Painter = (pen, W, H, accent) => {
  pen.r(0, 0, W, H, shade(accent, 0.35));
  pen.r(1, 1, W - 2, H - 2, shade(accent, 0.55));
  pen.r(3, 3, W - 6, H - 6, shade(accent, 0.4));
  pen.r(4, 4, W - 8, H - 8, shade(accent, 0.6));
};

const trophy: Painter = (pen) => {
  pen.r(4, 10, 8, 5, WOOD_D);
  pen.r(6, 3, 4, 6, "#E4B84A");
  pen.r(4, 3, 8, 2, "#F3C96B");
  pen.r(7, 9, 2, 1, "#B88A2E");
};

const safe: Painter = (pen, W) => {
  pen.r(0, 1, W, 14, OUT);
  pen.r(1, 2, W - 2, 12, "#4B5563");
  pen.disc(W / 2, 8, 3, "#9AA3AB");
  pen.p(W / 2, 8, OUT);
};

const flowerbed: Painter = (pen) => {
  pen.r(1, 3, 14, 11, "#7A5A3A");
  const colors = [PALETTE.coral, PALETTE.yellow, "#F2EFE8", PALETTE.lightBlue];
  for (let i = 0; i < 8; i++) pen.disc(3 + (i % 4) * 3, 6 + Math.floor(i / 4) * 4, 1, colors[i % 4]);
};

const PAINTERS: Partial<Record<FurnitureType, Painter>> = {
  desk, ceo_desk: ceoDesk, chair, plant, plant_big: plantBig, meeting_table: meetingTable, reception, sofa,
  armchair, low_table: lowTable, screen, whiteboard, bookshelf, cabinet, server, counter, stove, fridge, shelves,
  boxes, easel, cooler, printer, coffee, rug, trophy, safe, flowerbed, bench: lowTable, tree: plantBig,
};
