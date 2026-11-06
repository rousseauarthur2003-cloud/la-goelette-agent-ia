import Link from "next/link";
import type { Metadata } from "next";
import { listMissions } from "@/server/store";
import { DEPARTMENTS, POSITIONS, getDepartment } from "@/lib/organization";
import { MISSION_STATUSES, MISSION_STATUS_LABELS, PRIORITY_LABELS, formatDateTime } from "@/lib/labels";
import { EmptyState, MissionStatusBadge, ProvenanceTag } from "@/components/ui/badges";
import { MissionForm } from "@/components/missions/MissionForm";
import type { MissionStatus } from "@/types/domain";

export const metadata: Metadata = { title: "Missions" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MissionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const statut = one(sp.statut);
  const departement = one(sp.departement);
  const status = MISSION_STATUSES.includes(statut as MissionStatus) ? (statut as MissionStatus) : undefined;
  const dept = getDepartment(departement) ? departement : undefined;
  const missions = listMissions({ status, departmentId: dept });

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Missions</h1>
          <p>
            Une mission est confiée à un poste. Elle ne passe « En cours » que lorsqu&apos;un agent réel démarre une exécution :
            ce statut ne se pose jamais à la main.
          </p>
        </div>
        <Link href="/api/reports/export?type=missions" className="btn secondary">Exporter en CSV</Link>
      </div>

      <form className="card row" method="get" style={{ marginBottom: 16 }} aria-label="Filtrer les missions">
        <div className="field" style={{ minWidth: 200 }}>
          <label htmlFor="statut">Statut</label>
          <select id="statut" name="statut" defaultValue={status ?? ""}>
            <option value="">Tous</option>
            {MISSION_STATUSES.map((s) => <option key={s} value={s}>{MISSION_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="field" style={{ minWidth: 240 }}>
          <label htmlFor="departement">Département</label>
          <select id="departement" name="departement" defaultValue={dept ?? ""}>
            <option value="">Tous</option>
            {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div style={{ alignSelf: "flex-end" }} className="row">
          <button className="btn secondary" type="submit">Filtrer</button>
          {(status || dept) ? <Link href="/missions" className="btn secondary">Réinitialiser</Link> : null}
        </div>
      </form>

      {missions.length === 0 ? (
        <EmptyState>Aucune mission pour ces critères.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Mission</th><th>Département</th><th>Poste</th><th>Priorité</th><th>Statut</th><th>Créée</th><th>Échéance</th></tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr key={m.id}>
                  <td className="id"><Link href={`/missions/${m.id}`}>{m.id}</Link></td>
                  <td><Link href={`/missions/${m.id}`}>{m.title}</Link> <ProvenanceTag provenance={m.provenance} /></td>
                  <td>{getDepartment(m.departmentId)?.shortName}</td>
                  <td className="id">{m.assignedPositionId ?? "—"}</td>
                  <td>{PRIORITY_LABELS[m.priority]}</td>
                  <td><MissionStatusBadge status={m.status} /></td>
                  <td>{formatDateTime(m.createdAt)}</td>
                  <td>{formatDateTime(m.dueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="card" id="nouvelle" style={{ marginTop: 24, scrollMarginTop: 80 }}>
        <h2>Nouvelle mission</h2>
        <MissionForm
          departments={DEPARTMENTS.map((d) => ({ id: d.id, name: d.name }))}
          positions={POSITIONS.map((p) => ({ id: p.id, title: p.title, departmentId: p.departmentId }))}
          initialDepartment={dept ?? "MKT"}
          initialPosition={one(sp.poste)}
        />
      </section>
    </div>
  );
}
