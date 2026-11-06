/** Dimensions de référence (cahier §5). */
export const TILE = 32;
export const MAP_W = 120;
export const MAP_H = 88;
export const WORLD_W = MAP_W * TILE; // 3840
export const WORLD_H = MAP_H * TILE; // 2816

/** Palette de référence (cahier §3). */
export const PALETTE = {
  navy: "#263B56",
  lightBlue: "#78A9D1",
  offWhite: "#E7E2D8",
  softGreen: "#B8C7B0",
  wood: "#D6B77A",
  blueGray: "#667A8A",
  yellow: "#F3C96B",
  coral: "#D97868",
} as const;

/** Indices de tuiles du tileset généré. */
export const T = {
  OUTSIDE: 0,
  CORRIDOR: 1,
  WALL: 2,
  WALL_OUTER: 3,
  GLASS: 4,
  DOOR: 5,
  HALL: 6,
  MEETING: 7,
  WINDOW: 8,
  ENTRANCE: 9,
  PATH: 10,
  /** Sols de département : DEPT_FLOOR + index du département (0..9). */
  DEPT_FLOOR: 11,
} as const;

export const TILE_COUNT = T.DEPT_FLOOR + 10;

export const WALKABLE = new Set<number>([
  T.OUTSIDE, T.CORRIDOR, T.DOOR, T.HALL, T.MEETING, T.ENTRANCE, T.PATH,
  ...Array.from({ length: 10 }, (_, i) => T.DEPT_FLOOR + i),
]);
