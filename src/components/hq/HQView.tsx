"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppEvent, CompanySnapshot, PositionView } from "@/types/domain";
import type { DeskVisual, HQController, HQMode } from "@/game/scenes/createHQGame";
import { DEPARTMENTS, getDepartment } from "@/lib/organization";
import { DESK_STATE_COLORS, DESK_STATE_LABELS } from "@/lib/status";
import { EVENT_LABELS, formatDateTime } from "@/lib/labels";
import { Icon } from "@/components/ui/Icon";

const PhaserStage = dynamic(() => import("./PhaserStage"), {
  ssr: false,
  loading: () => <div className="hq-loading">Chargement du moteur 2D…</div>,
});

type Selection =
  | { kind: "desk"; id: string }
  | { kind: "room"; zoneId: string; departmentId: string | null }
  | { kind: "ceo" }
  | null;

const MODES: Array<{ id: HQMode; label: string; help: string }> = [
  { id: "game", label: "Jeu", help: "Déplacez l'avatar avec les flèches ou ZQSD, E pour interagir." },
  { id: "manage", label: "Gestion", help: "Cliquez sur un bureau ou une salle ; glissez pour déplacer la vue, molette pour zoomer." },
  { id: "monitor", label: "Surveillance", help: "Vue d'ensemble : occupation, exécutions réelles et alertes par salle." },
];

export function HQView({
  initialSnapshot,
  initialEvents,
  pendingApprovals,
  focus,
}: {
  initialSnapshot: CompanySnapshot;
  initialEvents: AppEvent[];
  pendingApprovals: number;
  focus: { positionId: string | null; departmentId: string | null };
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [events, setEvents] = useState(initialEvents);
  const [mode, setMode] = useState<HQMode>("manage");
  const [view, setView] = useState<"map" | "list">("map");
  const [selection, setSelection] = useState<Selection>(
    focus.positionId ? { kind: "desk", id: focus.positionId } : focus.departmentId ? { kind: "room", zoneId: `room-${focus.departmentId}`, departmentId: focus.departmentId } : null,
  );
  const [hint, setHint] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const controller = useRef<HQController | null>(null);

  // Sur petit écran, la carte n'est pas imposée : vue liste par défaut.
  useEffect(() => {
    if (window.matchMedia("(max-width: 720px)").matches) setView("list");
  }, []);

  // Rafraîchissement par polling (WebSocket non requis).
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!alive) return;
        setSnapshot(data.snapshot);
        setEvents(data.recentEvents);
        setStale(false);
      } catch {
        if (alive) setStale(true);
      }
    };
    const id = window.setInterval(tick, 10_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const desks: DeskVisual[] = useMemo(
    () =>
      snapshot.positions.map((p) => ({
        positionId: p.position.id,
        state: p.deskState,
        agentName: p.agent?.name ?? null,
        demo: p.agent?.provenance === "demo",
      })),
    [snapshot],
  );

  const callbacks = useMemo(
    () => ({
      onSelectDesk: (id: string) => setSelection({ kind: "desk", id }),
      onSelectRoom: (zoneId: string, departmentId: string | null) => setSelection({ kind: "room", zoneId, departmentId }),
      onSelectCeo: () => setSelection({ kind: "ceo" }),
      onHint: (h: string | null) => setHint(h),
      onReady: () => {
        if (focus.positionId) controller.current?.focusDesk(focus.positionId);
      },
    }),
    [focus.positionId],
  );

  const onController = useCallback((c: HQController | null) => {
    controller.current = c;
  }, []);

  const byId = useMemo(() => new Map(snapshot.positions.map((p) => [p.position.id, p])), [snapshot]);

  return (
    <div className="hq">
      <div className="hq-stage" aria-label="Siège virtuel en 2D">
        <div className="hq-toolbar">
          <div className="segmented" role="group" aria-label="Vue">
            <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}><Icon name="map" size={16} /> Carte</button>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}><Icon name="list" size={16} /> Liste</button>
          </div>
          {view === "map" ? (
            <>
              <div className="segmented" role="group" aria-label="Mode du siège">
                {MODES.map((m) => (
                  <button key={m.id} type="button" aria-pressed={mode === m.id} title={m.help} onClick={() => setMode(m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="segmented" role="group" aria-label="Zoom">
                <button type="button" title="Zoom avant" aria-label="Zoom avant" onClick={() => controller.current?.zoom(0.25)}><Icon name="zoomIn" size={16} /></button>
                <button type="button" title="Zoom arrière" aria-label="Zoom arrière" onClick={() => controller.current?.zoom(-0.25)}><Icon name="zoomOut" size={16} /></button>
                <button type="button" title="Recentrer" aria-label="Recentrer la vue" onClick={() => controller.current?.resetView()}><Icon name="target" size={16} /></button>
              </div>
            </>
          ) : null}
          {snapshot.mode === "demo" ? <span className="badge demo">Démonstration</span> : null}
          {stale ? <span className="badge danger">Données non actualisées</span> : null}
        </div>

        {view === "map" ? (
          <>
            <PhaserStage mode={mode} desks={desks} callbacks={callbacks} onController={onController} />
            <div className="hq-legend" aria-label="Légende des états">
              {(["working", "available", "inactive", "vacant"] as const).map((s) => (
                <span key={s} className="row" style={{ gap: 6 }}>
                  <span className="dot" style={{ background: DESK_STATE_COLORS[s] }} />
                  {s === "working" ? "Assis : exécution réelle" : s === "available" ? "Présent : disponible" : s === "inactive" ? "Fauteuil vide : inactif" : "Bureau vide : vacant"}
                </span>
              ))}
            </div>
            {hint ? <div className="hq-hint">{hint}</div> : <div className="hq-help">{MODES.find((m) => m.id === mode)?.help}</div>}
          </>
        ) : (
          <ListView positions={snapshot.positions} onSelect={(id) => setSelection({ kind: "desk", id })} />
        )}
      </div>

      <aside className="hq-panel" aria-live="polite">
        <Panel selection={selection} byId={byId} snapshot={snapshot} events={events} pendingApprovals={pendingApprovals} onFocus={(id) => {
          setView("map");
          controller.current?.focusDesk(id);
        }} />
      </aside>
    </div>
  );
}

function ListView({ positions, onSelect }: { positions: PositionView[]; onSelect: (id: string) => void }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "64px 12px 12px", background: "var(--paper)" }}>
      {DEPARTMENTS.map((d) => (
        <section key={d.id} className="card" style={{ marginBottom: 12, borderTop: `4px solid ${d.color}` }}>
          <h3>{d.name}</h3>
          <div className="table-wrap">
            <table>
              <tbody>
                {positions.filter((p) => p.position.departmentId === d.id).map((p) => (
                  <tr key={p.position.id} style={{ cursor: "pointer" }} onClick={() => onSelect(p.position.id)}>
                    <td className="id">{p.position.id}</td>
                    <td>{p.position.title}</td>
                    <td>{p.agent ? p.agent.name : <span className="muted">Vacant</span>}</td>
                    <td><span className="badge neutral"><span className="dot" style={{ background: DESK_STATE_COLORS[p.deskState] }} />{DESK_STATE_LABELS[p.deskState]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function Panel({
  selection,
  byId,
  snapshot,
  events,
  pendingApprovals,
  onFocus,
}: {
  selection: Selection;
  byId: Map<string, PositionView>;
  snapshot: CompanySnapshot;
  events: AppEvent[];
  pendingApprovals: number;
  onFocus: (id: string) => void;
}) {
  if (!selection) {
    const t = snapshot.totals;
    return (
      <div className="stack" style={{ gap: 12 }}>
        <h2>Siège de La Goëlette</h2>
        <p className="muted">Cliquez sur un bureau, une salle ou sur le CEO au centre du bâtiment pour afficher sa fiche.</p>
        <dl className="kv" style={{ gridTemplateColumns: "1fr auto" }}>
          <dt>Postes prévus</dt><dd>{t.positions}</dd>
          <dt>Occupés / vacants</dt><dd>{t.occupied} / {t.vacant}</dd>
          <dt>Disponibles</dt><dd>{t.available}</dd>
          <dt>En exécution réelle</dt><dd>{t.working}</dd>
          <dt>Validations en attente</dt><dd>{pendingApprovals}</dd>
        </dl>
        <RecentEvents events={events} />
      </div>
    );
  }

  if (selection.kind === "ceo") {
    const ceo = byId.get("DIR-01");
    return (
      <div className="stack" style={{ gap: 12 }}>
        <div className="row"><span className="id">DIR-01</span>{ceo ? <StateBadge view={ceo} /> : null}</div>
        <h2>CEO IA</h2>
        {snapshot.mode === "demo" ? <div className="alert info">CEO simulé : planificateur à règles, aucun modèle IA appelé.</div> : null}
        <p className="muted">Le CEO reçoit vos objectifs, propose des missions, les délègue et vous rend compte. Rien n&apos;est lancé sans votre accord.</p>
        <Link href="/ceo" className="btn accent"><Icon name="ceo" size={18} /> Ouvrir l&apos;espace CEO</Link>
        <dl className="kv" style={{ gridTemplateColumns: "1fr auto" }}>
          <dt>Missions en cours</dt><dd>{snapshot.missions.in_progress}</dd>
          <dt>Missions en attente</dt><dd>{snapshot.missions.pending + snapshot.missions.assigned + snapshot.missions.draft}</dd>
          <dt>Validations en attente</dt><dd>{pendingApprovals}</dd>
        </dl>
        <Link href="/agents/DIR-01" className="btn secondary small">Fiche du poste DIR-01</Link>
      </div>
    );
  }

  if (selection.kind === "desk") {
    const v = byId.get(selection.id);
    if (!v) return <p>Poste introuvable.</p>;
    const dept = getDepartment(v.position.departmentId)!;
    return (
      <div className="stack" style={{ gap: 10 }}>
        <div className="row"><span className="dept-swatch" style={{ background: dept.color }} /><small>{dept.name}</small></div>
        <h2><span className="id">{v.position.id}</span> — {v.position.title}</h2>
        <StateBadge view={v} />
        <small className="muted">{v.deskStateReason}</small>
        {v.agent ? (
          <dl className="kv" style={{ gridTemplateColumns: "120px 1fr" }}>
            <dt>Agent</dt><dd>{v.agent.name} {v.agent.provenance === "demo" ? <span className="badge demo">Démonstration</span> : null}</dd>
            <dt>Mission</dt><dd>{v.currentMission ? <Link href={`/missions/${v.currentMission.id}`}>{v.currentMission.title}</Link> : "—"}</dd>
            <dt>Dernière activité</dt><dd>{formatDateTime(v.agent.lastSeenAt)}</dd>
          </dl>
        ) : (
          <div className="alert info"><strong>Poste vacant.</strong> Aucun agent n&apos;est affecté. Un agent réel peut s&apos;y enregistrer via l&apos;API agents.</div>
        )}
        <div><small className="muted">Compétences</small><div className="tags">{v.position.skills.map((s) => <span key={s} className="tag">{s}</span>)}</div></div>
        <div><small className="muted">Outils autorisés (prévus)</small><div className="tags">{v.position.toolsAllowed.map((s) => <span key={s} className="tag">{s}</span>)}</div></div>
        <div><small className="muted">Permissions</small><div className="tags">{v.position.permissions.map((s) => <span key={s} className="tag perm">{s}</span>)}</div></div>
        <div className="row">
          <Link href={`/agents/${v.position.id}`} className="btn small">Fiche complète et historique</Link>
          <Link href={`/missions?departement=${v.position.departmentId}&poste=${v.position.id}#nouvelle`} className="btn secondary small">Confier une mission</Link>
          <button type="button" className="btn secondary small" onClick={() => onFocus(v.position.id)}>Centrer</button>
        </div>
      </div>
    );
  }

  // Salle
  const dept = selection.departmentId ? getDepartment(selection.departmentId) : null;
  if (!dept) {
    return (
      <div className="stack" style={{ gap: 10 }}>
        <h2>{selection.zoneId === "hall" ? "Hall d'accueil" : "Salle de réunion"}</h2>
        <p className="muted">
          {selection.zoneId === "hall"
            ? "Espace d'accueil au centre du bâtiment, sans poste de travail. Les entrées principales sont à l'ouest et à l'est."
            : "Salle de réunion partagée, sans poste de travail. Elle pourra accueillir les points d'équipe entre agents."}
        </p>
        <RecentEvents events={events} />
      </div>
    );
  }
  const views = snapshot.positions.filter((p) => p.position.departmentId === dept.id);
  const manager = byId.get(dept.managerPositionId);
  const count = (s: string) => views.filter((v) => v.deskState === s).length;
  const deptEvents = events.filter((e) => e.departmentId === dept.id);
  const missions = views.map((v) => v.currentMission).filter((m): m is NonNullable<typeof m> => Boolean(m));
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row"><span className="dept-swatch" style={{ background: dept.color }} /><small className="id">{dept.id}</small></div>
      <h2>{dept.name}</h2>
      <p className="muted" style={{ fontSize: "0.88rem" }}>{dept.description}</p>
      <dl className="kv" style={{ gridTemplateColumns: "1fr auto" }}>
        <dt>Responsable</dt><dd>{manager ? `${manager.position.id} ${manager.agent ? `· ${manager.agent.name}` : "· vacant"}` : "—"}</dd>
        <dt>Postes</dt><dd>{views.length}</dd>
        <dt>Occupés / vacants</dt><dd>{views.filter((v) => v.agent).length} / {count("vacant")}</dd>
        <dt>Agents disponibles</dt><dd>{count("available")}</dd>
        <dt>Exécutions réelles</dt><dd>{count("working")}</dd>
        <dt>Alertes</dt><dd>{count("error") + count("unknown")}</dd>
      </dl>
      <div>
        <small className="muted">Postes</small>
        <ul className="list">
          {views.map((v) => (
            <li key={v.position.id} className="row" style={{ padding: "6px 0" }}>
              <span className="dot" style={{ background: DESK_STATE_COLORS[v.deskState] }} />
              <button type="button" className="btn secondary small" onClick={() => onFocus(v.position.id)}>{v.position.id}</button>
              <span style={{ fontSize: "0.85rem" }}>{v.position.title}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <small className="muted">Missions des postes</small>
        {missions.length === 0 ? <p style={{ fontSize: "0.88rem" }}>Aucune mission active sur les postes.</p> : (
          <ul className="list">{missions.map((m) => <li key={m.id}><Link href={`/missions/${m.id}`}>{m.title}</Link></li>)}</ul>
        )}
      </div>
      <RecentEvents events={deptEvents} />
      <Link href={`/departements/${dept.slug}`} className="btn small">Page du département</Link>
    </div>
  );
}

function StateBadge({ view }: { view: PositionView }) {
  return (
    <span className="badge neutral" style={{ alignSelf: "flex-start" }}>
      <span className="dot" style={{ background: DESK_STATE_COLORS[view.deskState] }} />
      {DESK_STATE_LABELS[view.deskState]}
    </span>
  );
}

function RecentEvents({ events }: { events: AppEvent[] }) {
  return (
    <div>
      <small className="muted">Activité récente</small>
      {events.length === 0 ? <p style={{ fontSize: "0.88rem" }}>Aucune activité récente.</p> : (
        <ul className="timeline">
          {events.slice(0, 6).map((e) => (
            <li key={e.id} style={{ gridTemplateColumns: "1fr" }}>
              <time>{formatDateTime(e.createdAt)}</time>
              <div style={{ fontSize: "0.85rem" }}>
                <strong>{EVENT_LABELS[e.type]}</strong>
                {e.provenance === "demo" ? <> <span className="badge demo">Démonstration</span></> : null}
                <div>{e.summary}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
