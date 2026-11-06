import Link from "next/link";
import type { Metadata } from "next";
import { DEPARTMENTS, positionsOf } from "@/lib/organization";
import { getSnapshot, listMissions } from "@/server/store";
import { DESK_STATE_COLORS } from "@/lib/status";

export const metadata: Metadata = { title: "Départements" };

export default function DepartmentsPage() {
  const snap = getSnapshot();
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Départements</h1>
          <p>Dix départements, cinquante postes. Sélectionnez un département pour voir son équipe, ses missions et son historique.</p>
        </div>
      </div>
      <div className="grid grid-auto">
        {DEPARTMENTS.map((d) => {
          const views = snap.positions.filter((p) => p.position.departmentId === d.id);
          const occupied = views.filter((v) => v.agent).length;
          const working = views.filter((v) => v.deskState === "working").length;
          const missions = listMissions({ departmentId: d.id }).filter((m) => !["completed", "cancelled"].includes(m.status)).length;
          return (
            <Link key={d.id} href={`/departements/${d.slug}`} className="card dept-card" style={{ borderTopColor: d.color }}>
              <div className="row">
                <strong style={{ fontSize: "1.05rem", color: "var(--navy-900)" }}>{d.name}</strong>
                {d.priority ? <span className="badge warning">Prioritaire</span> : null}
              </div>
              <p className="muted" style={{ fontSize: "0.88rem", margin: 0 }}>{d.description}</p>
              <div className="bar">
                {views.map((v) => (
                  <span key={v.position.id} style={{ width: `${100 / views.length}%`, background: DESK_STATE_COLORS[v.deskState], borderRight: "1px solid #fff" }} />
                ))}
              </div>
              <small>
                {positionsOf(d.id).length} postes · {occupied} occupés · {working} en exécution · {missions} missions ouvertes
              </small>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
