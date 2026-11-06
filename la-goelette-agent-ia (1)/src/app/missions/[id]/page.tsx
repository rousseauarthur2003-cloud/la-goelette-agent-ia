import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allowedManualTransitions, getMission, listApprovals, listEvents, listExecutions } from "@/server/store";
import { getDepartment, positionsOf } from "@/lib/organization";
import { EVENT_LABELS, PRIORITY_LABELS, formatDateTime } from "@/lib/labels";
import { EmptyState, MissionStatusBadge, ProvenanceTag } from "@/components/ui/badges";
import { MissionActions } from "@/components/missions/MissionActions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: getMission(id)?.title ?? "Mission" };
}

export default async function MissionPage({ params }: Props) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) notFound();
  const dept = getDepartment(mission.departmentId)!;
  const events = listEvents({ entityId: mission.id });
  const approvals = listApprovals().filter((a) => a.missionId === mission.id);
  const executions = listExecutions().filter((e) => e.missionId === mission.id);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <div className="row"><span className="id">{mission.id}</span><MissionStatusBadge status={mission.status} /><ProvenanceTag provenance={mission.provenance} always /></div>
          <h1>{mission.title}</h1>
          {mission.description ? <p>{mission.description}</p> : null}
        </div>
        <Link href="/missions" className="btn secondary">Retour aux missions</Link>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h2>Détails</h2>
          <dl className="kv">
            <dt>Objectif</dt><dd>{mission.objective || "—"}</dd>
            <dt>Département</dt><dd><Link href={`/departements/${dept.slug}`}>{dept.name}</Link></dd>
            <dt>Poste responsable</dt><dd>{mission.assignedPositionId ? <Link href={`/agents/${mission.assignedPositionId}`} className="id">{mission.assignedPositionId}</Link> : "Non affectée"}</dd>
            <dt>Agent</dt><dd>{mission.assignedAgentId ?? "—"}</dd>
            <dt>Priorité</dt><dd>{PRIORITY_LABELS[mission.priority]}</dd>
            <dt>Créée</dt><dd>{formatDateTime(mission.createdAt)} par {mission.createdBy}</dd>
            <dt>Début</dt><dd>{formatDateTime(mission.startedAt)}</dd>
            <dt>Échéance</dt><dd>{formatDateTime(mission.dueAt)}</dd>
            <dt>Fin</dt><dd>{formatDateTime(mission.completedAt)}</dd>
            <dt>Livrable attendu</dt><dd>{mission.deliverable || "—"}</dd>
            <dt>Résultat</dt><dd>{mission.resultSummary ?? "—"}</dd>
          </dl>
        </section>

        <section className="card">
          <h2>Actions</h2>
          <MissionActions
            missionId={mission.id}
            status={mission.status}
            allowed={allowedManualTransitions(mission.status)}
            positions={positionsOf(mission.departmentId).map((p) => ({ id: p.id, title: p.title }))}
            currentPosition={mission.assignedPositionId}
          />
          <h3 style={{ marginTop: 18 }}>Exécutions</h3>
          {executions.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.88rem" }}>Aucune exécution réelle. Un agent connecté démarre l&apos;exécution via l&apos;API agents.</p>
          ) : (
            <ul className="list">
              {executions.map((e) => (
                <li key={e.id}><span className="id">{e.id}</span> — {e.status} · début {formatDateTime(e.startedAt)} · heartbeat {formatDateTime(e.heartbeatAt)}{e.errorMessage ? ` · ${e.errorMessage}` : ""}</li>
              ))}
            </ul>
          )}
          {approvals.length > 0 ? (
            <>
              <h3 style={{ marginTop: 18 }}>Validations</h3>
              <ul className="list">
                {approvals.map((a) => (
                  <li key={a.id}>{a.description} — <strong>{a.status === "pending" ? "en attente" : a.status === "approved" ? "approuvée" : "rejetée"}</strong> <Link href="/ceo#validations">Voir</Link></li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>Commentaires</h2>
          {mission.comments.length === 0 ? <EmptyState>Aucun commentaire.</EmptyState> : (
            <ul className="list">
              {mission.comments.map((c) => (
                <li key={c.id}><strong>{c.author}</strong> <small>{formatDateTime(c.createdAt)}</small><div style={{ whiteSpace: "pre-wrap" }}>{c.body}</div></li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2>Historique</h2>
          {events.length === 0 ? <EmptyState>Aucun événement.</EmptyState> : (
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
