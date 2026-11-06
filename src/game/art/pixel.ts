/**
 * Outils de dessin pixel art. Toutes les ressources graphiques du siège sont
 * des créations originales générées par code (aucun sprite tiers).
 * Unité : 1 « pixel art » = 2 pixels écran (tuile de 32 px = 16 pixels art).
 */
export const P = 2;

export type CanvasFactory = (w: number, h: number) => HTMLCanvasElement;

export const browserCanvas: CanvasFactory = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

export class Pen {
  constructor(public ctx: CanvasRenderingContext2D, public ox = 0, public oy = 0) {}
  /** Rectangle en unités pixel art. */
  r(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.ox + x * P, this.oy + y * P, w * P, h * P);
  }
  p(x: number, y: number, color: string) {
    this.r(x, y, 1, 1, color);
  }
  /** Rectangle avec contour. */
  box(x: number, y: number, w: number, h: number, fill: string, outline: string) {
    this.r(x, y, w, h, outline);
    this.r(x + 1, y + 1, w - 2, h - 2, fill);
  }
  /** Disque approximé en pixels. */
  disc(cx: number, cy: number, radius: number, color: string) {
    for (let y = -radius; y <= radius; y++) {
      const half = Math.floor(Math.sqrt(radius * radius - y * y) + 0.35);
      this.r(cx - half, cy + y, half * 2 + 1, 1, color);
    }
  }
}

/** Assombrit / éclaircit une couleur hexadécimale. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const f = (c: number) => (amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const r = clamp(f((n >> 16) & 255));
  const g = clamp(f((n >> 8) & 255));
  const b = clamp(f(n & 255));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Générateur pseudo-aléatoire déterministe. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
