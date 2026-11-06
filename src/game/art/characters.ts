/**
 * Personnages originaux en pixel art (16×24 pixels art, affichés en 32×48).
 * L'apparence est dérivée de façon déterministe de l'identifiant du poste :
 * peau, coiffure, couleurs de vêtements et accessoires varient (pas de clones).
 *
 * Feuille de sprites : 3 colonnes × 5 lignes
 *  ligne 0 : face (repos, pas gauche, pas droit)
 *  ligne 1 : profil gauche
 *  ligne 2 : profil droit
 *  ligne 3 : dos
 *  ligne 4 : assis au bureau (frappe 1, frappe 2, réflexion)
 */
import { PALETTE } from "@/game/config/constants";
import { Pen, hashString, rng, shade, type CanvasFactory } from "./pixel";

export const CHAR_W = 32;
export const CHAR_H = 48;
export const SHEET_COLS = 3;
export const SHEET_ROWS = 5;

export type HairStyle = "short" | "long" | "bun" | "curly" | "ponytail" | "buzz" | "cap";
export type Accessory = "none" | "glasses" | "headset" | "scarf" | "tie";

export interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  pants: string;
  shoes: string;
  accessory: Accessory;
  accent: string;
}

const SKINS = ["#F6D7BE", "#EBC1A0", "#D9A27C", "#B97F57", "#8D5A3B", "#6A4029"];
const HAIRS = ["#2B2321", "#4A3326", "#7A5234", "#B98A4E", "#D8B36A", "#A0443A", "#8F8F96", "#1F2A3A"];
const SHIRTS = [PALETTE.coral, PALETTE.lightBlue, PALETTE.softGreen, PALETTE.yellow, "#F2EFE8", "#8C7FA3", "#5E93C2", "#E39B6B", "#7E9A72", "#C77D93"];
const PANTS = [PALETTE.navy, "#3E4652", "#5A4A3A", PALETTE.blueGray, "#2E3440", "#7A6A55"];
const STYLES: HairStyle[] = ["short", "long", "bun", "curly", "ponytail", "buzz", "cap", "short", "long"] as HairStyle[];
const ACCESSORIES: Accessory[] = ["none", "none", "glasses", "headset", "scarf", "tie", "none", "glasses"];

export function lookFor(id: string, accent: string = PALETTE.blueGray): Look {
  const rand = rng(hashString(id));
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  return {
    skin: pick(SKINS),
    hair: pick(HAIRS),
    hairStyle: pick(STYLES),
    shirt: rand() > 0.45 ? accent : pick(SHIRTS),
    pants: pick(PANTS),
    shoes: rand() > 0.5 ? "#3A3A44" : "#6B4A32",
    accessory: pick(ACCESSORIES),
    accent,
  };
}

/** Apparence spécifique du CEO et de l'avatar du fondateur. */
export const CEO_LOOK: Look = {
  skin: "#EBC1A0", hair: "#8F8F96", hairStyle: "short", shirt: PALETTE.navy, pants: "#1F2A3A",
  shoes: "#3A3A44", accessory: "tie", accent: PALETTE.yellow,
};
export const FOUNDER_LOOK: Look = {
  skin: "#F6D7BE", hair: "#4A3326", hairStyle: "short", shirt: "#F2EFE8", pants: PALETTE.navy,
  shoes: "#6B4A32", accessory: "scarf", accent: PALETTE.coral,
};

const OUT = "#2A2A33";

export function drawCharacterSheet(make: CanvasFactory, look: Look): HTMLCanvasElement {
  const canvas = make(CHAR_W * SHEET_COLS, CHAR_H * SHEET_ROWS);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const frame = (col: number, row: number) => new Pen(ctx, col * CHAR_W, row * CHAR_H);
  for (let s = 0; s < 3; s++) {
    front(frame(s, 0), look, s);
    side(frame(s, 1), look, s, -1);
    side(frame(s, 2), look, s, 1);
    back(frame(s, 3), look, s);
  }
  seated(frame(0, 4), look, 0);
  seated(frame(1, 4), look, 1);
  seated(frame(2, 4), look, 2);
  return canvas;
}

function legs(pen: Pen, look: Look, step: number) {
  const l = step === 1 ? -1 : 0;
  const r = step === 2 ? -1 : 0;
  pen.r(5, 17, 3, 5 + l, OUT);
  pen.r(9, 17, 3, 5 + r, OUT);
  pen.r(6, 17, 1, 4 + l, look.pants);
  pen.r(10, 17, 1, 4 + r, look.pants);
  pen.r(5, 17, 6, 2, look.pants);
  pen.r(6, 17, 5, 1, shade(look.pants, 0.15));
  pen.r(5, 21 + l, 3, 2, look.shoes);
  pen.r(9, 21 + r, 3, 2, look.shoes);
}

function torso(pen: Pen, look: Look, armSwing: number) {
  pen.r(3, 10, 11, 8, OUT);
  pen.r(4, 11, 9, 6, look.shirt);
  pen.r(4, 11, 9, 1, shade(look.shirt, 0.18));
  pen.r(4, 16, 9, 1, shade(look.shirt, -0.15));
  // bras
  pen.r(2, 11 + armSwing, 2, 5, OUT);
  pen.r(13, 11 - armSwing, 2, 5, OUT);
  pen.r(2, 11 + armSwing, 1, 4, look.shirt);
  pen.r(14, 11 - armSwing, 1, 4, look.shirt);
  pen.r(2, 15 + armSwing, 2, 1, look.skin);
  pen.r(13, 15 - armSwing, 2, 1, look.skin);
  if (look.accessory === "tie") { pen.r(8, 11, 1, 4, look.accent); pen.p(8, 15, shade(look.accent, -0.2)); }
  if (look.accessory === "scarf") { pen.r(5, 10, 7, 2, look.accent); pen.r(9, 12, 2, 2, look.accent); }
}

function head(pen: Pen, look: Look, facing: "front" | "back" | "left" | "right") {
  pen.r(3, 1, 11, 10, OUT);
  pen.r(4, 2, 9, 8, look.skin);
  pen.r(4, 9, 9, 1, shade(look.skin, -0.1));
  hair(pen, look, facing);
  if (facing === "front") {
    pen.r(6, 6, 1, 2, OUT);
    pen.r(10, 6, 1, 2, OUT);
    pen.p(5, 8, shade(look.skin, -0.08));
    pen.p(11, 8, shade(look.skin, -0.08));
    pen.r(8, 8, 1, 1, shade(look.skin, -0.25));
    if (look.accessory === "glasses") { pen.r(5, 6, 3, 1, OUT); pen.r(9, 6, 3, 1, OUT); pen.p(8, 6, OUT); }
  } else if (facing === "left" || facing === "right") {
    const ex = facing === "left" ? 5 : 11;
    pen.r(ex, 6, 1, 2, OUT);
    if (look.accessory === "glasses") pen.r(facing === "left" ? 4 : 10, 6, 3, 1, OUT);
  }
  if (look.accessory === "headset") {
    pen.r(3, 2, 11, 1, "#3B3F46");
    pen.r(2, 5, 2, 3, "#3B3F46");
    pen.r(13, 5, 2, 3, "#3B3F46");
    if (facing !== "back") pen.r(4, 8, 2, 1, "#3B3F46");
  }
}

function hair(pen: Pen, look: Look, facing: "front" | "back" | "left" | "right") {
  const c = look.hair;
  const hi = shade(c, 0.2);
  switch (look.hairStyle) {
    case "buzz":
      pen.r(4, 2, 9, 2, c);
      break;
    case "cap":
      pen.r(3, 1, 11, 4, look.accent);
      pen.r(4, 1, 9, 1, shade(look.accent, 0.25));
      if (facing === "front") pen.r(3, 4, 11, 1, shade(look.accent, -0.25));
      if (facing === "left") pen.r(1, 4, 4, 1, shade(look.accent, -0.25));
      if (facing === "right") pen.r(12, 4, 4, 1, shade(look.accent, -0.25));
      break;
    case "curly":
      pen.r(3, 1, 11, 5, c);
      for (let x = 3; x < 14; x += 2) pen.p(x, 0, c);
      pen.r(3, 5, 1, 3, c);
      pen.r(13, 5, 1, 3, c);
      pen.p(6, 2, hi);
      pen.p(10, 3, hi);
      break;
    case "long":
      pen.r(3, 1, 11, 4, c);
      pen.r(2, 4, 2, 9, c);
      pen.r(13, 4, 2, 9, c);
      pen.p(6, 2, hi);
      break;
    case "bun":
      pen.r(3, 1, 11, 4, c);
      pen.r(6, -1 + 1, 5, 2, c);
      pen.p(7, 1, hi);
      break;
    case "ponytail":
      pen.r(3, 1, 11, 4, c);
      if (facing === "back") pen.r(7, 5, 3, 6, c);
      if (facing === "left") pen.r(13, 4, 2, 6, c);
      if (facing === "right") pen.r(2, 4, 2, 6, c);
      pen.p(6, 2, hi);
      break;
    default:
      pen.r(3, 1, 11, 4, c);
      pen.r(3, 4, 2, 2, c);
      pen.r(12, 4, 2, 2, c);
      pen.p(6, 2, hi);
      pen.p(9, 2, hi);
  }
  if (facing === "back" && look.hairStyle !== "cap" && look.hairStyle !== "buzz") pen.r(4, 2, 9, 7, c);
  if (facing === "back" && look.hairStyle === "buzz") pen.r(4, 2, 9, 5, c);
}

function front(pen: Pen, look: Look, step: number) {
  legs(pen, look, step);
  torso(pen, look, step === 0 ? 0 : step === 1 ? 1 : -1);
  head(pen, look, "front");
}

function back(pen: Pen, look: Look, step: number) {
  legs(pen, look, step);
  torso(pen, look, step === 0 ? 0 : step === 1 ? -1 : 1);
  head(pen, look, "back");
}

function side(pen: Pen, look: Look, step: number, dir: -1 | 1) {
  const swing = step === 0 ? 0 : step === 1 ? 1 : -1;
  // jambes de profil
  pen.r(6, 17, 5, 5, OUT);
  pen.r(7, 17, 3, 4, look.pants);
  if (swing !== 0) { pen.r(6 + swing * 2, 20, 3, 2, OUT); pen.r(6 + swing * 2, 21, 3, 1, look.pants); }
  pen.r(dir === 1 ? 7 : 5, 21, 5, 2, look.shoes);
  // buste
  pen.r(4, 10, 9, 8, OUT);
  pen.r(5, 11, 7, 6, look.shirt);
  pen.r(5, 11, 7, 1, shade(look.shirt, 0.18));
  pen.r(7 + swing, 11, 3, 5, shade(look.shirt, -0.12));
  pen.r(7 + swing, 15, 3, 1, look.skin);
  if (look.accessory === "scarf") pen.r(5, 10, 7, 2, look.accent);
  head(pen, look, dir === 1 ? "right" : "left");
}

function seated(pen: Pen, look: Look, frame: number) {
  // dossier du fauteuil derrière le personnage
  pen.r(2, 8, 13, 10, OUT);
  pen.r(3, 9, 11, 8, "#4B5563");
  // buste
  pen.r(3, 11, 11, 9, OUT);
  pen.r(4, 12, 9, 7, look.shirt);
  pen.r(4, 12, 9, 1, shade(look.shirt, 0.18));
  if (look.accessory === "tie") pen.r(8, 12, 1, 4, look.accent);
  if (look.accessory === "scarf") pen.r(5, 11, 7, 2, look.accent);
  // bras vers le bureau, mains qui tapent (alternance)
  const lh = frame === 0 ? 0 : frame === 1 ? 1 : 0;
  const rh = frame === 0 ? 1 : frame === 1 ? 0 : 0;
  pen.r(2, 13, 2, 7, OUT);
  pen.r(13, 13, 2, 7, OUT);
  pen.r(2, 13, 1, 6, look.shirt);
  pen.r(14, 13, 1, 6, look.shirt);
  pen.r(3, 20 + lh, 3, 2, OUT);
  pen.r(11, 20 + rh, 3, 2, OUT);
  pen.r(4, 20 + lh, 2, 1, look.skin);
  pen.r(11, 20 + rh, 2, 1, look.skin);
  head(pen, look, "front");
  if (frame === 2) {
    // regard levé (réflexion)
    pen.r(6, 6, 1, 1, look.skin);
    pen.r(10, 6, 1, 1, look.skin);
    pen.p(6, 5, OUT);
    pen.p(10, 5, OUT);
  }
}

/** Icônes d'état affichées au-dessus des personnages (16×16 pixels art). */
export type StateIcon = "thinking" | "talking" | "error" | "celebrating" | "waiting" | "paused" | "unknown";

export function drawStateIcons(make: CanvasFactory): HTMLCanvasElement {
  const icons: StateIcon[] = ["thinking", "talking", "error", "celebrating", "waiting", "paused", "unknown"];
  const canvas = make(32 * icons.length, 32);
  const ctx = canvas.getContext("2d")!;
  icons.forEach((icon, i) => {
    const pen = new Pen(ctx, i * 32, 0);
    const bubble = (fill: string) => {
      pen.r(1, 1, 14, 11, OUT);
      pen.r(2, 2, 12, 9, fill);
      pen.r(6, 12, 3, 2, OUT);
      pen.r(7, 12, 1, 1, fill);
    };
    switch (icon) {
      case "thinking":
        bubble("#FBFAF6");
        pen.r(4, 6, 2, 2, OUT); pen.r(7, 6, 2, 2, OUT); pen.r(10, 6, 2, 2, OUT);
        break;
      case "talking":
        bubble("#FBFAF6");
        pen.r(4, 4, 8, 1, PALETTE.blueGray); pen.r(4, 6, 6, 1, PALETTE.blueGray); pen.r(4, 8, 7, 1, PALETTE.blueGray);
        break;
      case "error":
        bubble("#F7D9D3");
        pen.r(7, 3, 2, 5, "#C0392B"); pen.r(7, 9, 2, 1, "#C0392B");
        break;
      case "celebrating":
        pen.r(7, 1, 2, 4, PALETTE.yellow); pen.r(2, 6, 4, 2, PALETTE.coral); pen.r(10, 6, 4, 2, PALETTE.lightBlue);
        pen.r(4, 11, 2, 2, PALETTE.softGreen); pen.r(11, 11, 2, 2, PALETTE.yellow); pen.p(8, 8, PALETTE.coral);
        break;
      case "waiting":
        bubble("#FCEFD0");
        pen.r(5, 3, 6, 1, OUT); pen.r(5, 9, 6, 1, OUT); pen.r(6, 4, 4, 2, "#E0A33E"); pen.r(7, 6, 2, 1, "#E0A33E"); pen.r(6, 7, 4, 2, "#E0A33E");
        break;
      case "paused":
        bubble("#FBFAF6");
        pen.r(5, 4, 2, 5, PALETTE.blueGray); pen.r(9, 4, 2, 5, PALETTE.blueGray);
        break;
      case "unknown":
        bubble("#EDE7F3");
        pen.r(6, 3, 4, 1, "#6E5A8A"); pen.r(10, 4, 1, 2, "#6E5A8A"); pen.r(8, 6, 2, 1, "#6E5A8A"); pen.r(8, 9, 2, 1, "#6E5A8A");
        break;
    }
  });
  return canvas;
}

export const STATE_ICON_INDEX: Record<StateIcon, number> = {
  thinking: 0, talking: 1, error: 2, celebrating: 3, waiting: 4, paused: 5, unknown: 6,
};
