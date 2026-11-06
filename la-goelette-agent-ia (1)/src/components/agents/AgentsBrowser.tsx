"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DeskState } from "@/types/domain";
import { DESK_STATE_COLORS, DESK_STATE_LABELS } from "@/lib/status";

export interface AgentRow {
  positionId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  departmentColor: string;
  agentName: string | null;
  demo: boolean;
  state: DeskState;
  skills: string[];
  mission: { id: string; title: string } | null;
}

const STATES: DeskState[] = ["working", "available", "inactive", "vacant", "error", "paused", "waiting_approval", "offline", "unknown"];

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Liste filtrable et recherchable des postes et agents. */
export function AgentsBrowser({
  rows,
  departments,
  initial,
}: {
  rows: AgentRow[];
  departments: Array<{ id: string; name: string }>;
  initial: { q: string; dept: string; state: string };
}) {
  const [q, setQ] = useState(initial.q);
  const [dept, setDept] = useState(initial.dept);
  const [state, setState] = useState(initial.state);
  const [skill, setSkill] = useState("");
  const skills = useMemo(() => [...new Set(rows.flatMap((r) => r.skills))].sort((a, b) => a.localeCompare(b, "fr")), [rows]);

  const filtered = rows.filter((r) => {
    if (dept && r.departmentId !== dept) return false;
    if (state && r.state !== state) return false;
    if (skill && !r.skills.includes(skill)) return false;
    if (q) {
      const hay = norm([r.positionId, r.title, r.departmentName, r.agentName ?? "", ...r.skills].join(" "));
      if (!hay.includes(norm(q))) return false;
    }
    return true;
  });

  return (
    <div className="stack">
      <div className="card">
        <div className="form-grid" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
          <div className="field">
            <label htmlFor="q">Recherche</label>
            <input id="q" type="search" placeholder="Poste, intitulé, agent, compétence…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="dept">Département</label>
            <select id="dept" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">Tous</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="state">État</label>
            <select id="state" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Tous</option>
              {STATES.map((s) => <option key={s} value={s}>{DESK_STATE_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="skill">Compétence</label>
            <select id="skill" value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">Toutes</option>
              {skills.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="row">
        <small>{filtered.length} poste{filtered.length > 1 ? "s" : ""} sur {rows.length}</small>
        <span className="spacer" />
        {(q || dept || state || skill) ? (
          <button className="btn secondary small" type="button" onClick={() => { setQ(""); setDept(""); setState(""); setSkill(""); }}>
            Réinitialiser les filtres
          </button>
        ) : null}
      </div>
      {filtered.length === 0 ? (
        <div className="empty">Aucun poste ne correspond à ces critères.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Poste</th><th>Intitulé</th><th>Département</th><th>Agent</th><th>État</th><th>Mission</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.positionId}>
                  <td className="id"><Link href={`/agents/${r.positionId}`}>{r.positionId}</Link></td>
                  <td><Link href={`/agents/${r.positionId}`}>{r.title}</Link></td>
                  <td><span className="row" style={{ gap: 6 }}><span className="dept-swatch" style={{ background: r.departmentColor }} />{r.departmentName}</span></td>
                  <td>
                    {r.agentName ? (
                      <>
                        {r.agentName} {r.demo ? <span className="badge demo">Démonstration</span> : null}
                      </>
                    ) : (
                      <span className="muted">Poste vacant</span>
                    )}
                  </td>
                  <td>
                    <span className="badge neutral"><span className="dot" style={{ background: DESK_STATE_COLORS[r.state] }} />{DESK_STATE_LABELS[r.state]}</span>
                  </td>
                  <td>{r.mission ? <Link href={`/missions/${r.mission.id}`}>{r.mission.title}</Link> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
