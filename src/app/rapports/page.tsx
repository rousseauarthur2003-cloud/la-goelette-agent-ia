import Link from "next/link";
import type { Metadata } from "next";
import { DEPARTMENTS } from "@/lib/organization";
import { getSnapshot, listEvents, listMissions } from "@/server/store";
import { MISSION_STATUSES, MISSION_STATUS_LABELS } from "@/lib/labels";
import { DeptSwatch } from "@/components/ui/badges";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Rapports" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const PERIODS: Record<string, { label: string; days: number | null }> = {
  "7j": { label: "7 derniers jours", days: 7 },
  "30j": { label: "30 derniers jours", days: 30 },
  tout: { label: "Depuis le début", days: null },
};

export default async function ReportsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const periodKey = typeof sp.periode === "string" && PERIODS[sp.periode] ? sp.periode : "30j";
  const period = PERIODS[periodKey];
  const since = period.days ? Date.now() - period.days * 86_400_000 : 0;
  const inPeriod = (iso: string) => Date.parse(iso) >= since;

  const snap = getSnapshot();
  const missions = listMissions().filter((m) => inPeriod(m.createdAt));
  const events = listEvents().filter((e) => inPeriod(e.createdAt));
  const demoShare = missions.length ? missions.filter((m) => m.provenance === "demo").length : 0;

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Rapports</h1>
          <p>
            Indicateurs calculés à partir des données enregistrées dans l&apos;application. Les éléments de démonstration
            sont comptés séparément ; aucune statistique externe n&apos;est inventée.
          </p>
        </div>
        <form method="get" className="row">
          <label htmlFor="periode" className="muted">Période</label>
          <select id="periode" name="periode" defaultValue={periodKey} style={{ width: "auto" }}>
            {Object.entries(PERIODS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
          <button className="btn secondary small" type="submit">Afficher</button>
        </form>
      </div>

      <section className="grid grid-4">
        <div className="card stat"><span className="stat-value">{missions.length}</span><span className="stat-label">missions créées</span><span className="stat-note">dont {demoShare} de démonstration</span></div>
        <div className="card stat"><span className="stat-value">{missions.filter((m) => m.status === "completed").length}</span><span className="stat-label">missions terminées</span></div>
        <div className="card stat"><span className="stat-value">{events.filter((e) => e.type === "execution.started").length}</span><span className="stat-label">exécutions réelles démarrées</span></div>
        <div className="card stat"><span className="stat-value">{events.filter((e) => e.type.startsWith("approval.") && e.type !== "approval.requested").length}</span><span className="stat-label">décisions de validation</span></div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h2>Rapport par département</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Département</th>
                {MISSION_STATUSES.map((s) => <th key={s}>{MISSION_STATUS_LABELS[s]}</th>)}
                <th>Postes occupés</th>
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((d) => {
                const mine = missions.filter((m) => m.departmentId === d.id);
                const views = snap.positions.filter((p) => p.position.departmentId === d.id);
                return (
                  <tr key={d.id}>
                    <td><span className="row" style={{ gap: 6 }}><DeptSwatch color={d.color} /><Link href={`/departements/${d.slug}`}>{d.shortName}</Link></span></td>
                    {MISSION_STATUSES.map((s) => <td key={s}>{mine.filter((m) => m.status === s).length || "·"}</td>)}
                    <td>{views.filter((v) => v.agent).length}/{views.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Exports CSV</h2>
        <p className="muted">Fichiers compatibles avec Excel (UTF-8). Ils reflètent l&apos;état en mémoire au moment de l&apos;export.</p>
        <div className="row">
          <a className="btn secondary" href="/api/reports/export?type=missions"><Icon name="download" size={16} /> Missions</a>
          <a className="btn secondary" href="/api/reports/export?type=positions"><Icon name="download" size={16} /> Postes et agents</a>
          <a className="btn secondary" href="/api/reports/export?type=events"><Icon name="download" size={16} /> Journal des événements</a>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Rapports par agent et par mission</h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          Chaque <Link href="/agents">fiche de poste</Link> présente les missions et l&apos;historique de l&apos;agent ; chaque{" "}
          <Link href="/missions">mission</Link> présente ses exécutions, validations, commentaires et événements.
        </p>
      </section>
    </div>
  );
}
