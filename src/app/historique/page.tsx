import Link from "next/link";
import type { Metadata } from "next";
import { listEvents } from "@/server/store";
import { DEPARTMENTS, getDepartment } from "@/lib/organization";
import { formatDateTime } from "@/lib/labels";
import { EmptyState, ProvenanceTag } from "@/components/ui/badges";

export const metadata: Metadata = { title: "Historique" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FAMILIES: Record<string, string> = {
  mission: "Missions (création, affectation, statut, commentaire)",
  execution: "Exécutions (début, fin, erreur)",
  approval: "Validations (demande, approbation, rejet)",
  agent: "Agents (changement d'état)",
  permission: "Permissions",
  ceo: "CEO (objectifs, plans)",
  system: "Système",
};

export default async function HistoryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const type = FAMILIES[one(sp.type)] ? one(sp.type) : "";
  const dept = getDepartment(one(sp.departement)) ? one(sp.departement) : "";
  const q = one(sp.q).slice(0, 100).toLowerCase();
  const events = listEvents({ type: type || undefined, departmentId: dept || undefined })
    .filter((e) => !q || e.summary.toLowerCase().includes(q))
    .slice(0, 300);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Historique</h1>
          <p>Journal des événements : créations, affectations, exécutions, changements d&apos;état, erreurs, validations et permissions.</p>
        </div>
        <Link href="/api/reports/export?type=events" className="btn secondary">Exporter en CSV</Link>
      </div>

      <form method="get" className="card form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr auto", marginBottom: 16 }}>
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={type}>
            <option value="">Tous</option>
            {Object.entries(FAMILIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="departement">Département</label>
          <select id="departement" name="departement" defaultValue={dept}>
            <option value="">Tous</option>
            {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="q">Recherche</label>
          <input id="q" name="q" defaultValue={q} placeholder="Mot-clé…" />
        </div>
        <div className="row" style={{ alignSelf: "flex-end" }}>
          <button className="btn secondary" type="submit">Filtrer</button>
        </div>
      </form>

      {events.length === 0 ? <EmptyState>Aucun événement pour ces critères.</EmptyState> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Résumé</th><th>Département</th><th>Acteur</th><th>Origine</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(e.createdAt)}</td>
                  <td><code>{e.type}</code></td>
                  <td>
                    {e.entityType === "mission" ? <Link href={`/missions/${e.entityId}`}>{e.summary}</Link> : e.summary}
                  </td>
                  <td>{e.departmentId ? getDepartment(e.departmentId)?.shortName : "—"}</td>
                  <td><small>{e.actorType} · {e.actorId}</small></td>
                  <td><ProvenanceTag provenance={e.provenance} always /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
