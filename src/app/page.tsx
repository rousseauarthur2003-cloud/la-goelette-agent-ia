import Link from "next/link";
import { getSnapshot, listApprovals, listEvents, listMissions } from "@/server/store";
import { DEPARTMENTS, positionsOf } from "@/lib/organization";
import { DESK_STATE_COLORS } from "@/lib/status";
import { EVENT_LABELS, MISSION_STATUS_LABELS, formatDateTime } from "@/lib/labels";
import { DeptSwatch, EmptyState, MissionStatusBadge, ProvenanceTag } from "@/components/ui/badges";
import { Icon } from "@/components/ui/Icon";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import type { MissionStatus } from "@/types/domain";

export default function DashboardPage() {
  const snap = getSnapshot();
  const missions = listMissions().slice(0, 6);
  const events = listEvents({ limit: 8 });
  const approvals = listApprovals("pending");
  const alerts = snap.positions.filter((p) => ["error", "unknown"].includes(p.deskState));
  const t = snap.totals;
  const missionGroups: Array<{ label: string; statuses: MissionStatus[]; tone: string }> = [
    { label: "En cours", statuses: ["in_progress"], tone: "var(--success)" },
    { label: "En attente", statuses: ["draft", "pending", "assigned", "waiting_approval"], tone: "var(--light-blue)" },
    { label: "Terminées", statuses: ["completed"], tone: "var(--soft-green)" },
    { label: "En erreur", statuses: ["failed"], tone: "var(--coral)" },
  ];

  return (
    <div className="content">
      <AutoRefresh seconds={20} />
      <div className="page-head">
        <div>
          <h1>Tableau de bord</h1>
          <p>
            Vue d&apos;ensemble de La Goélette : organisation, activité réelle des agents, missions et validations.
            Le département marketing est prioritaire au lancement.
          </p>
        </div>
        <div className="row">
          <Link href="/siege" className="btn">
            <Icon name="map" size={18} /> Entrer dans le siège
          </Link>
          <Link href="/ceo" className="btn accent">
            <Icon name="ceo" size={18} /> Parler au CEO
          </Link>
        </div>
      </div>

      <section className="grid grid-4" aria-label="Indicateurs principaux">
        <div className="card stat">
          <span className="stat-value">{t.positions}</span>
          <span className="stat-label">postes prévus · 10 départements</span>
          <span className="stat-note">Organigramme de référence</span>
        </div>
        <div className="card stat">
          <span className="stat-value">
            {t.occupied}
            <small style={{ fontSize: "1rem" }}> / {t.positions}</small>
          </span>
          <span className="stat-label">postes occupés · {t.vacant} vacants</span>
          <span className="stat-note">Inclut les agents de démonstration le cas échéant</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{t.available}</span>
          <span className="stat-label">agents disponibles</span>
          <span className="stat-note">{t.inactive} inactifs · {t.otherStates} autres états</span>
        </div>
        <div className="card stat">
          <span className="stat-value" style={{ color: "var(--success)" }}>{t.working}</span>
          <span className="stat-label">agents en exécution réelle</span>
          <span className="stat-note">Exécution identifiée + heartbeat récent uniquement</span>
        </div>
      </section>

      <section className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <h2>Missions</h2>
            <Link href="/missions" className="btn secondary small">Toutes</Link>
          </div>
          <div className="grid grid-2" style={{ gap: 10 }}>
            {missionGroups.map((g) => (
              <Link key={g.label} href={`/missions?statut=${g.statuses[0]}`} className="card stat" style={{ padding: 12, textDecoration: "none", borderLeft: `4px solid ${g.tone}` }}>
                <span className="stat-value" style={{ fontSize: "1.4rem" }}>{g.statuses.reduce((n, s) => n + snap.missions[s], 0)}</span>
                <span className="stat-label">{g.label}</span>
              </Link>
            ))}
          </div>
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 10, marginBottom: 0 }}>
            Attente = brouillon, en attente, affectée ou en validation ({MISSION_STATUS_LABELS.waiting_approval.toLowerCase()} : {snap.missions.waiting_approval}).
          </p>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Alertes et validations</h2>
            <Link href="/ceo#validations" className="btn secondary small">Traiter</Link>
          </div>
          {approvals.length === 0 && alerts.length === 0 ? (
            <EmptyState>Aucune alerte ni validation en attente.</EmptyState>
          ) : (
            <ul className="list">
              {approvals.map((a) => (
                <li key={a.id}>
                  <div className="row">
                    <span className="badge warning">Validation</span>
                    <ProvenanceTag provenance={a.provenance} />
                  </div>
                  <div style={{ marginTop: 4 }}>{a.description}</div>
                  <small>{a.requestedBy}</small>
                </li>
              ))}
              {alerts.map((p) => (
                <li key={p.position.id}>
                  <span className="badge danger">{p.position.id}</span> {p.deskStateReason}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Dernières activités</h2>
            <Link href="/historique" className="btn secondary small">Historique</Link>
          </div>
          {events.length === 0 ? (
            <EmptyState>Aucune activité enregistrée.</EmptyState>
          ) : (
            <ul className="timeline">
              {events.map((e) => (
                <li key={e.id}>
                  <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
                  <div>
                    <strong style={{ fontSize: "0.8rem" }}>{EVENT_LABELS[e.type]}</strong>{" "}
                    <ProvenanceTag provenance={e.provenance} />
                    <div>{e.summary}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h2>Activité par département</h2>
          <div className="legend">
            {(["working", "available", "inactive", "vacant"] as const).map((s) => (
              <span key={s}>
                <span className="dot" style={{ background: DESK_STATE_COLORS[s] }} />
                {{ working: "En exécution", available: "Disponible", inactive: "Inactif", vacant: "Vacant" }[s]}
              </span>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Département</th>
                <th>Postes</th>
                <th style={{ minWidth: 180 }}>Répartition</th>
                <th>Missions actives</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((d) => {
                const views = snap.positions.filter((p) => p.position.departmentId === d.id);
                const count = (s: string) => views.filter((v) => v.deskState === s).length;
                const active = listMissions({ departmentId: d.id }).filter((m) => ["assigned", "in_progress", "waiting_approval", "pending"].includes(m.status)).length;
                const manager = views.find((v) => v.position.id === d.managerPositionId);
                return (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/departements/${d.slug}`} className="row" style={{ gap: 8, textDecoration: "none" }}>
                        <DeptSwatch color={d.color} />
                        <strong>{d.name}</strong>
                        {d.priority ? <span className="badge warning">Prioritaire</span> : null}
                      </Link>
                    </td>
                    <td>{positionsOf(d.id).length}</td>
                    <td>
                      <div className="bar" title={`${count("working")} en exécution, ${count("available")} disponibles, ${count("inactive")} inactifs, ${count("vacant")} vacants`}>
                        {(["working", "available", "inactive", "vacant"] as const).map((s) => (
                          <span key={s} style={{ width: `${(count(s) / views.length) * 100}%`, background: DESK_STATE_COLORS[s] }} />
                        ))}
                      </div>
                    </td>
                    <td>{active}</td>
                    <td>
                      <span className="id">{d.managerPositionId}</span> {manager?.position.title}
                      {manager?.agent ? <small> — {manager.agent.name}</small> : <small> — vacant</small>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h2>Missions récentes</h2>
          <Link href="/missions#nouvelle" className="btn small">
            <Icon name="plus" size={16} /> Nouvelle mission
          </Link>
        </div>
        {missions.length === 0 ? (
          <EmptyState>Aucune mission. Confiez un objectif au CEO ou créez une mission.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Mission</th><th>Poste</th><th>Statut</th><th>Créée</th></tr>
              </thead>
              <tbody>
                {missions.map((m) => (
                  <tr key={m.id}>
                    <td className="id"><Link href={`/missions/${m.id}`}>{m.id}</Link></td>
                    <td>
                      <Link href={`/missions/${m.id}`}>{m.title}</Link> <ProvenanceTag provenance={m.provenance} />
                    </td>
                    <td className="id">{m.assignedPositionId ?? "—"}</td>
                    <td><MissionStatusBadge status={m.status} /></td>
                    <td>{formatDateTime(m.createdAt)}</td>
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
