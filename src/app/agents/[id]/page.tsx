import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPosition } from "@/lib/organization";
import { listEvents, listMissions, positionView } from "@/server/store";
import { EVENT_LABELS, formatDateTime } from "@/lib/labels";
import { DeskStateBadge, DeptSwatch, EmptyState, MissionStatusBadge, ProvenanceTag } from "@/components/ui/badges";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = getPosition(id.toUpperCase());
  return { title: p ? `${p.id} — ${p.title}` : "Poste" };
}

/** Fiche d'un poste et de l'agent qui l'occupe (cahier §8). */
export default async function PositionPage({ params }: Props) {
  const { id } = await params;
  const view = positionView(id.toUpperCase());
  if (!view) notFound();
  const { position, agent, department } = view;
  const missions = listMissions({ positionId: position.id });
  const events = listEvents({ limit: 200 }).filter(
    (e) => e.entityId === position.id || (agent && e.actorId === agent.id) || missions.some((m) => m.id === e.entityId),
  ).slice(0, 15);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <div className="row">
            <DeptSwatch color={department.color} />
            <Link href={`/departements/${department.slug}`}>{department.name}</Link>
          </div>
          <h1><span className="id" style={{ fontSize: "1.2rem" }}>{position.id}</span> — {position.title}</h1>
          <p>{position.description}</p>
        </div>
        <div className="row">
          <Link href={`/siege?poste=${position.id}`} className="btn secondary">Voir le bureau dans le siège</Link>
          <Link href={`/missions?departement=${position.departmentId}&poste=${position.id}#nouvelle`} className="btn">Confier une mission</Link>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h2>Poste et agent</h2>
          <dl className="kv">
            <dt>Identifiant</dt><dd className="id">{position.id}</dd>
            <dt>Département</dt><dd>{department.name}</dd>
            <dt>Agent affecté</dt>
            <dd>{agent ? <>{agent.name} <span className="id">({agent.id})</span> <ProvenanceTag provenance={agent.provenance} always /></> : <strong>Poste vacant</strong>}</dd>
            <dt>État</dt><dd><DeskStateBadge state={view.deskState} /> <small>{view.deskStateReason}</small></dd>
            {agent ? <><dt>Statut agent</dt><dd><code>{agent.status}</code> · connexion <code>{agent.connectionStatus}</code></dd></> : null}
            <dt>Exécution</dt>
            <dd>{view.activeExecution ? <>En cours <span className="id">{view.activeExecution.id}</span> — heartbeat {formatDateTime(view.activeExecution.heartbeatAt)}</> : "Aucune exécution réelle en cours"}</dd>
            <dt>Mission actuelle</dt>
            <dd>{view.currentMission ? <Link href={`/missions/${view.currentMission.id}`}>{view.currentMission.title}</Link> : "—"}</dd>
            <dt>Dernière activité</dt><dd>{formatDateTime(agent?.lastSeenAt)}</dd>
            <dt>Position du bureau</dt><dd>tuile ({view.desk.x}, {view.desk.y})</dd>
          </dl>
        </section>

        <section className="card">
          <h2>Compétences, outils et permissions</h2>
          <h3 style={{ marginTop: 8 }}>Compétences</h3>
          <div className="tags">{position.skills.map((s) => <span key={s} className="tag">{s}</span>)}</div>
          <h3 style={{ marginTop: 14 }}>Outils autorisés <small className="muted">(prévus — aucun outil externe n&apos;est encore connecté)</small></h3>
          <div className="tags">{position.toolsAllowed.map((s) => <span key={s} className="tag">{s}</span>)}</div>
          <h3 style={{ marginTop: 14 }}>Permissions</h3>
          <div className="tags">{position.permissions.map((s) => <span key={s} className="tag perm">{s}</span>)}</div>
          <p className="muted" style={{ fontSize: "0.82rem", marginTop: 12, marginBottom: 0 }}>
            Aucun agent ne peut approuver une action sensible : les validations sont réservées au fondateur.
            Les agents logiciels réels s&apos;affectent à un poste via l&apos;API agents protégée par jeton
            (voir <code>docs/agents/agent-api.md</code>).
          </p>
        </section>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>Missions du poste</h2>
          {missions.length === 0 ? <EmptyState>Aucune mission confiée à ce poste.</EmptyState> : (
            <ul className="list">
              {missions.map((m) => (
                <li key={m.id} className="row">
                  <Link href={`/missions/${m.id}`}>{m.title}</Link>
                  <ProvenanceTag provenance={m.provenance} />
                  <span className="spacer" />
                  <MissionStatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2>Historique récent</h2>
          {events.length === 0 ? <EmptyState>Aucun événement pour ce poste.</EmptyState> : (
            <ul className="timeline">
              {events.map((e) => (
                <li key={e.id}><time>{formatDateTime(e.createdAt)}</time><div><strong style={{ fontSize: "0.8rem" }}>{EVENT_LABELS[e.type]}</strong> <ProvenanceTag provenance={e.provenance} /><div>{e.summary}</div></div></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
