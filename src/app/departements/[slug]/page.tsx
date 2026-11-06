import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDepartmentBySlug } from "@/lib/organization";
import { getSnapshot, listEvents, listMissions } from "@/server/store";
import { EVENT_LABELS, formatDateTime } from "@/lib/labels";
import { DeskStateBadge, DeptSwatch, EmptyState, MissionStatusBadge, ProvenanceTag } from "@/components/ui/badges";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: getDepartmentBySlug(slug)?.name ?? "Département" };
}

export default async function DepartmentPage({ params }: Props) {
  const { slug } = await params;
  const dept = getDepartmentBySlug(slug);
  if (!dept) notFound();
  const views = getSnapshot().positions.filter((p) => p.position.departmentId === dept.id);
  const missions = listMissions({ departmentId: dept.id });
  const events = listEvents({ departmentId: dept.id, limit: 15 });
  const manager = views.find((v) => v.position.id === dept.managerPositionId)!;
  const count = (s: string) => views.filter((v) => v.deskState === s).length;

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <div className="row"><DeptSwatch color={dept.color} /><small className="id">{dept.id}</small></div>
          <h1>{dept.name}</h1>
          <p>{dept.description}</p>
        </div>
        <div className="row">
          <Link href={`/siege?salle=${dept.id}`} className="btn secondary">Voir la salle dans le siège</Link>
          <Link href={`/missions?departement=${dept.id}#nouvelle`} className="btn">Nouvelle mission</Link>
        </div>
      </div>

      <section className="grid grid-4">
        <div className="card stat"><span className="stat-value">{views.length}</span><span className="stat-label">postes</span></div>
        <div className="card stat"><span className="stat-value">{views.filter((v) => v.agent).length}</span><span className="stat-label">occupés · {count("vacant")} vacants</span></div>
        <div className="card stat"><span className="stat-value">{count("available")}</span><span className="stat-label">disponibles</span></div>
        <div className="card stat"><span className="stat-value" style={{ color: "var(--success)" }}>{count("working")}</span><span className="stat-label">exécutions réelles en cours</span></div>
      </section>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>Responsable et objectifs</h2>
          <dl className="kv">
            <dt>Responsable</dt>
            <dd>
              <Link href={`/agents/${manager.position.id}`} className="id">{manager.position.id}</Link> {manager.position.title}
              {manager.agent ? ` — ${manager.agent.name}` : " — poste vacant"}{" "}
              {manager.agent ? <ProvenanceTag provenance={manager.agent.provenance} /> : null}
            </dd>
            <dt>Objectifs</dt>
            <dd><ul style={{ margin: 0, paddingLeft: 18 }}>{dept.objectives.map((o) => <li key={o}>{o}</li>)}</ul></dd>
          </dl>
        </section>
        <section className="card">
          <h2>Historique récent</h2>
          {events.length === 0 ? <EmptyState>Aucun événement pour ce département.</EmptyState> : (
            <ul className="timeline">
              {events.map((e) => (
                <li key={e.id}>
                  <time>{formatDateTime(e.createdAt)}</time>
                  <div><strong style={{ fontSize: "0.8rem" }}>{EVENT_LABELS[e.type]}</strong> <ProvenanceTag provenance={e.provenance} /><div>{e.summary}</div></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Postes</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Poste</th><th>Intitulé</th><th>Agent</th><th>État</th><th>Mission actuelle</th></tr></thead>
            <tbody>
              {views.map((v) => (
                <tr key={v.position.id}>
                  <td className="id"><Link href={`/agents/${v.position.id}`}>{v.position.id}</Link></td>
                  <td>{v.position.title}</td>
                  <td>{v.agent ? <>{v.agent.name} <ProvenanceTag provenance={v.agent.provenance} /></> : <span className="muted">Poste vacant</span>}</td>
                  <td><DeskStateBadge state={v.deskState} /></td>
                  <td>{v.currentMission ? <Link href={`/missions/${v.currentMission.id}`}>{v.currentMission.title}</Link> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Missions du département</h2>
        {missions.length === 0 ? <EmptyState>Aucune mission pour ce département.</EmptyState> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Mission</th><th>Poste</th><th>Statut</th><th>Échéance</th></tr></thead>
              <tbody>
                {missions.map((m) => (
                  <tr key={m.id}>
                    <td className="id"><Link href={`/missions/${m.id}`}>{m.id}</Link></td>
                    <td><Link href={`/missions/${m.id}`}>{m.title}</Link> <ProvenanceTag provenance={m.provenance} /></td>
                    <td className="id">{m.assignedPositionId ?? "—"}</td>
                    <td><MissionStatusBadge status={m.status} /></td>
                    <td>{formatDateTime(m.dueAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
