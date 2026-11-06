/**
 * Siège virtuel 2D — moteur Phaser 3, exécuté UNIQUEMENT côté navigateur.
 * Phaser est injecté en paramètre (import dynamique dans le composant React),
 * ce qui évite toute erreur de rendu serveur.
 *
 * Fonctions : carte en tuiles, caméra panoramique, zoom, mini-carte, avatar avec
 * collisions (murs, mobilier), portes, sélection des bureaux et des salles,
 * personnages animés selon l'état réel des postes, trois modes (jeu, gestion,
 * surveillance).
 */
import { TILE, WORLD_H, WORLD_W, PALETTE } from "@/game/config/constants";
import { buildMap, zoneAt, type DeskAnchor, type HQMap } from "@/game/maps/buildMap";
import { drawTileset } from "@/game/art/tiles";
import { drawFurniture, type DeskVariant } from "@/game/art/furniture";
import {
  CEO_LOOK, CHAR_H, CHAR_W, FOUNDER_LOOK, SHEET_COLS, STATE_ICON_INDEX, drawCharacterSheet, drawStateIcons, lookFor,
  type StateIcon,
} from "@/game/art/characters";
import { browserCanvas } from "@/game/art/pixel";
import { DEPARTMENTS, getDepartment } from "@/lib/organization";
import { DESK_STATE_COLORS } from "@/lib/status";
import type { DeskState } from "@/types/domain";

export type HQMode = "game" | "manage" | "monitor";

export interface DeskVisual {
  positionId: string;
  state: DeskState;
  agentName: string | null;
  demo: boolean;
}

export interface HQCallbacks {
  onSelectDesk(positionId: string): void;
  onSelectRoom(zoneId: string, departmentId: string | null): void;
  onSelectCeo(): void;
  onHint(text: string | null): void;
  onReady(): void;
}

export interface HQController {
  setDesks(desks: DeskVisual[]): void;
  setMode(mode: HQMode): void;
  zoom(delta: number): void;
  resetView(): void;
  focusDesk(positionId: string): void;
  destroy(): void;
}

// Phaser est typé de façon souple : le module est chargé dynamiquement.
/* eslint-disable @typescript-eslint/no-explicit-any */
type PhaserNS = any;

const SEATED_FRAMES = [4 * SHEET_COLS, 4 * SHEET_COLS + 1];
const THINK_FRAME = 4 * SHEET_COLS + 2;

export function createHQGame(Phaser: PhaserNS, parent: HTMLElement, initialMode: HQMode, cb: HQCallbacks): HQController {
  const map: HQMap = buildMap();
  let mode: HQMode = initialMode;
  let pendingDesks: DeskVisual[] | null = null;
  let sceneRef: any = null;

  class HQScene extends Phaser.Scene {
    map = map;
    deskImages = new Map<string, any>();
    chairImages = new Map<string, any>();
    chars = new Map<string, any>();
    icons = new Map<string, any>();
    markers = new Map<string, any>();
    roomLabels = new Map<string, any>();
    desksState = new Map<string, DeskVisual>();
    avatar: any;
    keys: any;
    minimap: any;
    viewRect: any;
    selection: any;
    hover: any;
    drag = { active: false, moved: false, sx: 0, sy: 0, cx: 0, cy: 0 };
    facing = "down";

    constructor() {
      super({ key: "hq" });
    }

    create() {
      sceneRef = this;
      const tex = this.textures;
      if (!tex.exists("tiles")) tex.addCanvas("tiles", drawTileset(browserCanvas));
      if (!tex.exists("icons")) {
        const t = tex.addCanvas("icons", drawStateIcons(browserCanvas));
        Object.values(STATE_ICON_INDEX).forEach((i) => t.add(i, 0, i * 32, 0, 32, 32));
      }

      // Carte en tuiles
      const tm = this.make.tilemap({ data: map.tiles, tileWidth: TILE, tileHeight: TILE });
      const tileset = tm.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0);
      tm.createLayer(0, tileset, 0, 0).setDepth(0);

      // Mobilier
      for (const f of map.furniture) {
        const accent = f.departmentId ? getDepartment(f.departmentId)?.color ?? PALETTE.blueGray : PALETTE.blueGray;
        const variant: DeskVariant = f.positionId ? "empty" : "idle";
        const img = this.add.image(f.x * TILE, f.y * TILE, this.furnitureKey(f.type, f.w, f.h, accent, variant)).setOrigin(0, 0);
        img.setDepth(f.type === "rug" ? 1 : f.type === "screen" || f.type === "whiteboard" ? 2 : (f.y + f.h) * TILE);
        if (f.positionId && (f.type === "desk" || f.type === "ceo_desk")) {
          img.setData("meta", { type: f.type, w: f.w, h: f.h, accent });
          this.deskImages.set(f.positionId, img);
        }
        if (f.positionId && f.type === "chair") this.chairImages.set(f.positionId, img);
      }

      // Libellés des salles (sur le mur supérieur)
      for (const z of map.zones) {
        const dept = z.departmentId ? getDepartment(z.departmentId) : null;
        const label = this.add
          .text((z.rect.x + z.rect.width / 2) * TILE, z.rect.y * TILE + 4, dept ? dept.shortName : z.label, {
            fontFamily: "ui-monospace, Menlo, Consolas, monospace",
            fontSize: "15px",
            color: "#FFFFFF",
            backgroundColor: dept ? dept.color : PALETTE.blueGray,
            padding: { x: 8, y: 3 },
            resolution: 2,
          })
          .setOrigin(0.5, 0)
          .setDepth(5000);
        this.roomLabels.set(z.id, label);
      }

      // Sélection / survol
      this.selection = this.add.graphics().setDepth(6000);
      this.hover = this.add.graphics().setDepth(5999);

      // Avatar du fondateur
      this.ensureSheet("founder", FOUNDER_LOOK);
      this.createWalkAnims("founder");
      this.avatar = this.add.sprite(map.spawn.x * TILE + 16, (map.spawn.y + 1) * TILE, "char:founder", 0).setOrigin(0.5, 1);
      this.avatar.setDepth(this.avatar.y);

      // Clavier : flèches, ZQSD (AZERTY), WASD, E/Espace/Entrée pour interagir
      const K = Phaser.Input.Keyboard.KeyCodes;
      this.keys = this.input.keyboard?.addKeys({
        up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT,
        z: K.Z, q: K.Q, s: K.S, d: K.D, w: K.W, a: K.A,
        e: K.E, space: K.SPACE, enter: K.ENTER,
      }, true);
      this.input.keyboard?.on("keydown-E", () => this.interact());
      this.input.keyboard?.on("keydown-SPACE", () => this.interact());
      this.input.keyboard?.on("keydown-ENTER", () => this.interact());

      // Caméra principale et mini-carte
      const cam = this.cameras.main;
      cam.setBounds(0, 0, WORLD_W, WORLD_H);
      cam.setBackgroundColor("#A9C196");
      cam.setRoundPixels(true);
      this.minimap = this.cameras.add(0, 0, 200, 147).setZoom(200 / WORLD_W).setName("minimap");
      this.minimap.setBounds(0, 0, WORLD_W, WORLD_H).centerOn(WORLD_W / 2, WORLD_H / 2);
      this.minimap.setBackgroundColor("#A9C196");
      this.viewRect = this.add.graphics().setDepth(9000);
      cam.ignore(this.viewRect);
      this.minimap.ignore([...this.roomLabels.values(), this.hover]);
      this.layoutMinimap();
      this.scale.on("resize", () => this.layoutMinimap());

      // Souris / tactile : clic = sélection, glisser = panoramique, molette = zoom
      this.input.on("pointerdown", (p: any) => {
        if (this.isOnMinimap(p)) return;
        this.drag = { active: true, moved: false, sx: p.x, sy: p.y, cx: cam.scrollX, cy: cam.scrollY };
      });
      this.input.on("pointermove", (p: any) => {
        if (this.drag.active && p.isDown) {
          const dx = p.x - this.drag.sx, dy = p.y - this.drag.sy;
          if (Math.abs(dx) + Math.abs(dy) > 6) this.drag.moved = true;
          if (this.drag.moved && mode !== "game") {
            cam.stopFollow();
            cam.setScroll(this.drag.cx - dx / cam.zoom, this.drag.cy - dy / cam.zoom);
          }
        }
        this.updateHover(p);
      });
      this.input.on("pointerup", (p: any) => {
        if (this.isOnMinimap(p)) {
          const mx = (p.x - this.minimap.x) / this.minimap.zoom, my = (p.y - this.minimap.y) / this.minimap.zoom;
          cam.stopFollow();
          cam.centerOn(mx, my);
          return;
        }
        const wasDrag = this.drag.moved;
        this.drag.active = false;
        if (!wasDrag) {
          const wp = cam.getWorldPoint(p.x, p.y);
          this.clickAt(wp.x, wp.y);
        }
      });
      this.input.on("wheel", (_p: any, _o: any, _dx: number, dy: number) => {
        this.zoomBy(dy > 0 ? -0.15 : 0.15);
      });

      this.applyMode();
      if (pendingDesks) this.applyDesks(pendingDesks);
      cb.onReady();
    }

    // ---------------------------------------------------------------- textures
    furnitureKey(type: any, w: number, h: number, accent: string, variant: DeskVariant): string {
      const key = `f:${type}:${w}x${h}:${accent}:${variant}`;
      if (!this.textures.exists(key)) this.textures.addCanvas(key, drawFurniture(browserCanvas, type, w, h, accent, variant));
      return key;
    }

    ensureSheet(id: string, look: any) {
      const key = `char:${id}`;
      if (this.textures.exists(key)) return key;
      const t = this.textures.addCanvas(key, drawCharacterSheet(browserCanvas, look));
      for (let row = 0; row < 5; row++)
        for (let col = 0; col < SHEET_COLS; col++) t.add(row * SHEET_COLS + col, 0, col * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H);
      return key;
    }

    createWalkAnims(id: string) {
      const key = `char:${id}`;
      const mk = (name: string, frames: number[], rate: number, repeat = -1) => {
        if (!this.anims.exists(`${id}:${name}`))
          this.anims.create({ key: `${id}:${name}`, frames: frames.map((f) => ({ key, frame: f })), frameRate: rate, repeat });
      };
      mk("walk-down", [1, 0, 2, 0], 8);
      mk("walk-left", [4, 3, 5, 3], 8);
      mk("walk-right", [7, 6, 8, 6], 8);
      mk("walk-up", [10, 9, 11, 9], 8);
      mk("working", SEATED_FRAMES, 4);
      mk("thinking", [THINK_FRAME, SEATED_FRAMES[0]], 1);
      mk("idle", [0], 1);
    }

    // ---------------------------------------------------------------- états
    applyDesks(list: DeskVisual[]) {
      for (const d of list) {
        this.desksState.set(d.positionId, d);
        const anchor = map.desks.find((a) => a.positionId === d.positionId);
        if (anchor) this.renderDesk(anchor, d);
      }
      this.updateRoomLabels();
      this.drawSelection();
    }

    renderDesk(anchor: DeskAnchor, d: DeskVisual) {
      const deskImg = this.deskImages.get(d.positionId);
      const chair = this.chairImages.get(d.positionId);
      const s = d.state;
      const present = s === "working" || s === "available" || s === "error" || s === "paused" || s === "waiting_approval" || s === "unknown";
      const seated = s === "working" || s === "error";
      const variant: DeskVariant = s === "working" ? "on" : s === "vacant" ? "empty" : present ? "idle" : "off";
      if (deskImg) {
        const m = deskImg.getData("meta");
        deskImg.setTexture(this.furnitureKey(m.type, m.w, m.h, m.accent, variant));
      }
      chair?.setVisible(!present);

      const isCeo = d.positionId === "DIR-01";
      const cx = anchor.seat.x * TILE + (isCeo ? TILE : TILE / 2);
      let sprite = this.chars.get(d.positionId);
      if (present) {
        const accent = getDepartment(anchor.departmentId)?.color ?? PALETTE.blueGray;
        const id = d.positionId;
        this.ensureSheet(id, isCeo ? CEO_LOOK : lookFor(id, accent));
        this.createWalkAnims(id);
        if (!sprite) {
          sprite = this.add.sprite(cx, 0, `char:${id}`, 0).setOrigin(0.5, 1);
          this.chars.set(id, sprite);
        }
        const footY = (anchor.seat.y + 1) * TILE + (seated ? 10 : 0);
        sprite.setPosition(cx, footY).setDepth(seated ? anchor.desk.y * TILE + 2 : footY - 1);
        sprite.setAlpha(s === "unknown" ? 0.55 : 1);
        if (s === "working") sprite.play(`${id}:working`, true);
        else if (s === "error") { sprite.stop(); sprite.setFrame(THINK_FRAME); }
        else { sprite.stop(); sprite.setFrame(0); }
        this.tweens.killTweensOf(sprite);
        if (s === "available") this.tweens.add({ targets: sprite, scaleY: 1.03, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        else sprite.setScale(1);
      } else if (sprite) {
        this.tweens.killTweensOf(sprite);
        sprite.destroy();
        this.chars.delete(d.positionId);
      }

      // Icône d'état (réflexion, erreur, attente…) — prévue pour toutes les animations du cahier
      const iconName: StateIcon | null =
        s === "error" ? "error" : s === "waiting_approval" ? "waiting" : s === "paused" ? "paused" : s === "unknown" ? "unknown" : null;
      let icon = this.icons.get(d.positionId);
      if (iconName) {
        if (!icon) {
          icon = this.add.image(cx, 0, "icons", STATE_ICON_INDEX[iconName]).setOrigin(0.5, 1).setDepth(7000);
          this.icons.set(d.positionId, icon);
          this.tweens.add({ targets: icon, y: "-=4", duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        }
        icon.setFrame(STATE_ICON_INDEX[iconName]);
        icon.setPosition(cx, (anchor.seat.y + 1) * TILE - CHAR_H - 2);
      } else if (icon) {
        this.tweens.killTweensOf(icon);
        icon.destroy();
        this.icons.delete(d.positionId);
      }

      // Pastille d'état (modes gestion et surveillance)
      let marker = this.markers.get(d.positionId);
      if (!marker) {
        marker = this.add.graphics().setDepth(6500);
        this.markers.set(d.positionId, marker);
      }
      marker.clear();
      const mx = anchor.desk.x * TILE + (isCeo ? TILE * 2 : TILE * 2) - 6;
      const my = anchor.desk.y * TILE + TILE - 4;
      marker.fillStyle(0x2a2a33, 1).fillCircle(mx, my, 7);
      marker.fillStyle(parseInt(DESK_STATE_COLORS[s].slice(1), 16), 1).fillCircle(mx, my, 5);
      marker.setVisible(mode !== "game");
      this.minimap.ignore(marker);
    }

    updateRoomLabels() {
      for (const dept of DEPARTMENTS) {
        const label = this.roomLabels.get(`room-${dept.id}`);
        if (!label) continue;
        if (mode === "monitor") {
          const mine = [...this.desksState.values()].filter((d) => d.positionId.startsWith(`${dept.id}-`));
          const occupied = mine.filter((d) => d.state !== "vacant").length;
          const working = mine.filter((d) => d.state === "working").length;
          const alerts = mine.filter((d) => d.state === "error" || d.state === "unknown").length;
          label.setText(`${dept.shortName} · ${occupied}/${mine.length} occupés · ${working} en exécution${alerts ? ` · ⚠ ${alerts}` : ""}`);
        } else {
          label.setText(dept.shortName);
        }
      }
    }

    // ---------------------------------------------------------------- modes et caméra
    applyMode() {
      const cam = this.cameras.main;
      this.avatar.setVisible(mode === "game");
      for (const m of this.markers.values()) m.setVisible(mode !== "game");
      for (const l of this.roomLabels.values()) l.setFontSize(mode === "monitor" ? "26px" : "15px");
      this.updateRoomLabels();
      if (mode === "game") {
        cam.setZoom(Math.max(1.25, this.fitZoom() * 2));
        cam.startFollow(this.avatar, true, 0.15, 0.15);
      } else {
        cam.stopFollow();
        cam.setZoom(this.fitZoom());
        cam.centerOn(WORLD_W / 2, WORLD_H / 2);
      }
      cb.onHint(null);
    }

    fitZoom(): number {
      const { width, height } = this.scale.gameSize;
      return Math.min(width / WORLD_W, height / WORLD_H) * 0.98;
    }

    zoomBy(delta: number) {
      const cam = this.cameras.main;
      const min = Math.min(0.2, this.fitZoom());
      cam.setZoom(Phaser.Math.Clamp(cam.zoom * (1 + delta), min, 3));
    }

    layoutMinimap() {
      const { width, height } = this.scale.gameSize;
      const mw = Math.min(200, Math.max(120, width * 0.22));
      const mh = (mw * WORLD_H) / WORLD_W;
      this.minimap.setSize(mw, mh).setPosition(width - mw - 10, height - mh - 10).setZoom(mw / WORLD_W);
      this.minimap.centerOn(WORLD_W / 2, WORLD_H / 2);
      this.minimap.setVisible(width > 480);
    }

    isOnMinimap(p: any): boolean {
      const m = this.minimap;
      return m.visible && p.x >= m.x && p.x <= m.x + m.width && p.y >= m.y && p.y <= m.y + m.height;
    }

    // ---------------------------------------------------------------- interactions
    deskAtTile(tx: number, ty: number): DeskAnchor | null {
      return (
        map.desks.find((a) => {
          const isCeo = a.positionId === "DIR-01";
          const x0 = isCeo ? a.desk.x - 1 : a.desk.x;
          const x1 = isCeo ? a.desk.x + 2 : a.desk.x + 1;
          const inDesk = ty === a.desk.y && tx >= x0 && tx <= x1;
          const inSeat = (ty === a.seat.y || ty === a.seat.y - 1) && tx >= a.seat.x && tx <= a.seat.x + (isCeo ? 1 : 0);
          return inDesk || inSeat;
        }) ?? null
      );
    }

    clickAt(wx: number, wy: number) {
      const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
      const desk = this.deskAtTile(tx, ty);
      if (desk) return this.selectDesk(desk.positionId);
      const zone = zoneAt(map, tx, ty);
      if (zone) {
        this.selected = { kind: "zone", id: zone.id };
        this.drawSelection();
        cb.onSelectRoom(zone.id, zone.departmentId ?? null);
      }
    }

    selected: { kind: "desk" | "zone"; id: string } | null = null;

    selectDesk(positionId: string) {
      this.selected = { kind: "desk", id: positionId };
      this.drawSelection();
      if (positionId === "DIR-01") cb.onSelectCeo();
      else cb.onSelectDesk(positionId);
    }

    drawSelection() {
      const g = this.selection;
      g.clear();
      if (!this.selected) return;
      g.lineStyle(3, parseInt(PALETTE.yellow.slice(1), 16), 1);
      if (this.selected.kind === "desk") {
        const a = map.desks.find((d) => d.positionId === this.selected!.id);
        if (!a) return;
        const isCeo = a.positionId === "DIR-01";
        const x = (isCeo ? a.desk.x - 1 : a.desk.x) * TILE;
        g.strokeRoundedRect(x - 4, (a.seat.y - 1) * TILE, (isCeo ? 4 : 2) * TILE + 8, 3 * TILE + 4, 6);
      } else {
        const z = map.zones.find((zz) => zz.id === this.selected!.id);
        if (z) g.strokeRect(z.rect.x * TILE, z.rect.y * TILE, z.rect.width * TILE, z.rect.height * TILE);
      }
    }

    updateHover(p: any) {
      if (this.isOnMinimap(p)) return;
      const wp = this.cameras.main.getWorldPoint(p.x, p.y);
      const tx = Math.floor(wp.x / TILE), ty = Math.floor(wp.y / TILE);
      const desk = this.deskAtTile(tx, ty);
      this.hover.clear();
      this.input.setDefaultCursor(desk ? "pointer" : this.drag.active ? "grabbing" : "default");
      if (desk) {
        const isCeo = desk.positionId === "DIR-01";
        this.hover.lineStyle(2, 0xffffff, 0.9);
        this.hover.strokeRoundedRect((isCeo ? desk.desk.x - 1 : desk.desk.x) * TILE - 2, (desk.seat.y - 1) * TILE + 2, (isCeo ? 4 : 2) * TILE + 4, 3 * TILE - 2, 6);
      }
    }

    nearestInteractable(): DeskAnchor | null {
      const ax = this.avatar.x / TILE, ay = this.avatar.y / TILE;
      let best: DeskAnchor | null = null, bestD = 2.2;
      for (const a of map.desks) {
        const fx = a.front.x + 1, fy = a.front.y + 0.5;
        const d = Math.hypot(fx - ax, fy - ay);
        if (d < bestD) { bestD = d; best = a; }
      }
      return best;
    }

    interact() {
      if (mode !== "game") return;
      const a = this.nearestInteractable();
      if (a) return this.selectDesk(a.positionId);
      const zone = zoneAt(map, Math.floor(this.avatar.x / TILE), Math.floor((this.avatar.y - 4) / TILE));
      if (zone) cb.onSelectRoom(zone.id, zone.departmentId ?? null);
    }

    blocked(px: number, py: number): boolean {
      // boîte de collision aux pieds (18×10 px)
      const pts = [[px - 9, py - 10], [px + 9, py - 10], [px - 9, py - 1], [px + 9, py - 1]];
      return pts.some(([x, y]) => {
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
        return tx < 0 || ty < 0 || tx >= map.width || ty >= map.height || map.collision[ty][tx];
      });
    }

    lastHint: string | null = null;

    update(_t: number, dtMs: number) {
      const cam = this.cameras.main;
      // rectangle de vue dans la mini-carte
      this.viewRect.clear();
      this.viewRect.lineStyle(14, 0xffffff, 0.95);
      this.viewRect.strokeRect(cam.worldView.x, cam.worldView.y, cam.worldView.width, cam.worldView.height);

      if (mode !== "game" || !this.keys) return;
      const k = this.keys;
      const typing = typeof document !== "undefined" && ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "");
      if (typing) return;
      let vx = 0, vy = 0;
      if (k.left.isDown || k.q.isDown || k.a.isDown) vx -= 1;
      if (k.right.isDown || k.d.isDown) vx += 1;
      if (k.up.isDown || k.z.isDown || k.w.isDown) vy -= 1;
      if (k.down.isDown || k.s.isDown) vy += 1;
      const speed = 170 * (dtMs / 1000);
      if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }
      const nx = this.avatar.x + vx * speed, ny = this.avatar.y + vy * speed;
      if (vx && !this.blocked(nx, this.avatar.y)) this.avatar.x = nx;
      if (vy && !this.blocked(this.avatar.x, ny)) this.avatar.y = ny;
      this.avatar.setDepth(this.avatar.y);

      if (vx || vy) {
        this.facing = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? "left" : "right") : vy < 0 ? "up" : "down";
        this.avatar.play(`founder:walk-${this.facing}`, true);
      } else {
        this.avatar.stop();
        this.avatar.setFrame({ down: 0, left: 3, right: 6, up: 9 }[this.facing as "down"]);
      }

      const near = this.nearestInteractable();
      let hint: string | null = null;
      if (near) {
        const d = this.desksState.get(near.positionId);
        hint = near.positionId === "DIR-01" ? "E : parler au CEO" : `E : consulter le poste ${near.positionId}${d?.agentName ? ` (${d.agentName})` : ""}`;
      }
      if (hint !== this.lastHint) { this.lastHint = hint; cb.onHint(hint); }
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#A9C196",
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth || 800, height: parent.clientHeight || 600 },
    scene: [HQScene],
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: { target: parent } },
  });

  return {
    setDesks(desks) {
      pendingDesks = desks;
      if (sceneRef?.minimap) sceneRef.applyDesks(desks);
    },
    setMode(next) {
      mode = next;
      if (sceneRef?.avatar) sceneRef.applyMode();
    },
    zoom(delta) {
      sceneRef?.zoomBy(delta);
    },
    resetView() {
      if (sceneRef) sceneRef.applyMode();
    },
    focusDesk(positionId) {
      const a = map.desks.find((d) => d.positionId === positionId);
      if (!a || !sceneRef) return;
      const cam = sceneRef.cameras.main;
      cam.stopFollow();
      cam.setZoom(Math.max(cam.zoom, 1));
      cam.pan(a.desk.x * TILE + TILE, a.desk.y * TILE, 400, "Sine.easeInOut");
      sceneRef.selected = { kind: "desk", id: positionId };
      sceneRef.drawSelection();
    },
    destroy() {
      sceneRef = null;
      game.destroy(true);
    },
  };
}
