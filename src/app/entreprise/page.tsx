import Link from "next/link";
import type { Metadata } from "next";
import { DEPARTMENTS } from "@/lib/organization";
import { getSnapshot } from "@/server/store";
import { DESK_STATE_COLORS, DESK_STATE_LABELS } from "@/lib/status";
import { DeptSwatch } from "@/components/ui/badges";

export const metadata: Metadata = { title: "Entreprise" };

export default function CompanyPage() {
  const snap = getSnapshot();
  const view = (id: string) => snap.positions.find((p) => p.position.id === id)!;
  const ceo = view("DIR-01");
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Entreprise</h1>
          <p>
            Organigramme de La Goélette : le fondateur fixe les objectifs, le CEO IA organise le travail et délègue aux
            dix départements. 50 postes prévus — un poste n&apos;est pas un agent, et un agent n&apos;est pas une exécution.
          </p>
        </div>
      </div>

      <div className="org">
        <div className="org-ceo">
          <div className="org-node ceo">
            <small>Fondateur</small>
            <div style={{ fontWeight: 700 }}>Objectifs et validations</div>
          </div>
        </div>
        <div className="org-ceo">
          <Link href="/ceo" className="org-node ceo" style={{ textDecoration: "none" }}>
            <small className="id">DIR-01</small>
            <div style={{ fontWeight: 700 }}>CEO IA</div>
            <small>
              <span className="dot" style={{ background: DESK_STATE_COLORS[ceo.deskState] }} /> {DESK_STATE_LABELS[ceo.deskState]}
              {ceo.agent ? ` · ${ceo.agent.name}${ceo.agent.provenance === "demo" ? " (démonstration)" : ""}` : ""}
            </small>
          </Link>
        </div>
        <div className="org-depts">
          {DEPARTMENTS.map((d) => {
            const positions = snap.positions.filter((p) => p.position.departmentId === d.id);
            return (
              <section key={d.id} className="card org-dept" style={{ borderTop: `4px solid ${d.color}` }}>
                <h3>
                  <DeptSwatch color={d.color} />
                  <Link href={`/departements/${d.slug}`}>{d.name}</Link>
                </h3>
                <small>{positions.length} postes · responsable {d.managerPositionId}</small>
                <ul>
                  {positions.map((p) => (
                    <li key={p.position.id}>
                      <span className="dot" style={{ background: DESK_STATE_COLORS[p.deskState] }} title={DESK_STATE_LABELS[p.deskState]} />
                      <Link href={`/agents/${p.position.id}`} className="id">{p.position.id}</Link>
                      <span style={{ fontWeight: p.position.id === d.managerPositionId ? 700 : 400 }}>{p.position.title}</span>
                    </li>
                  ))}
                </ul>
                <div>
                  <small className="muted">Objectifs</small>
                  <ul style={{ marginTop: 2 }}>
                    {d.objectives.map((o) => <li key={o}>• {o}</li>)}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
