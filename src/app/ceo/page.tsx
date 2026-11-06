import Link from "next/link";
import type { Metadata } from "next";
import { getConfig } from "@/server/config";
import { listApprovals, listCeoMessages, listMissions, listProposals, positionView } from "@/server/store";
import { isFounderSession } from "@/server/session";
import { CeoSpace } from "@/components/ceo/CeoSpace";
import { ApprovalsPanel } from "@/components/ceo/ApprovalsPanel";
import { DeskStateBadge, EmptyState, MissionStatusBadge, ProvenanceTag } from "@/components/ui/badges";

export const metadata: Metadata = { title: "Espace CEO" };

export default async function CeoPage() {
  const cfg = getConfig();
  const ceo = positionView("DIR-01")!;
  const active = listMissions().filter((m) => ["assigned", "in_progress", "waiting_approval", "pending"].includes(m.status));
  const simulated = !(cfg.mode === "connected" && cfg.aiConfigured);
  const founder = await isFounderSession();

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <div className="row">
            <span className="id">DIR-01</span>
            <DeskStateBadge state={ceo.deskState} />
            {simulated ? <span className="badge demo">CEO simulé — aucun modèle IA</span> : <span className="badge success">CEO connecté · {cfg.aiProvider}</span>}
          </div>
          <h1>Espace CEO</h1>
          <p>
            Donnez un objectif au CEO : il le reformule, le découpe en missions et propose de les confier aux départements.
            Rien n&apos;est lancé sans votre accord, et toute action sensible exige votre validation.
          </p>
        </div>
      </div>

      {simulated ? (
        <div className="alert info" style={{ marginBottom: 16 }}>
          {cfg.mode === "demo"
            ? "Mode démonstration : les réponses viennent d'un planificateur à règles déterministe, présenté comme tel. Aucun fournisseur IA n'est appelé."
            : "Mode connecté, mais aucun fournisseur IA n'est configuré (AI_PROVIDER, AI_API_KEY, AI_MODEL) : le planificateur à règles est utilisé."}
        </div>
      ) : null}

      <div className="grid grid-2">
        <section className="card">
          <h2>Conversation et objectifs</h2>
          <CeoSpace initialMessages={listCeoMessages()} initialProposals={listProposals()} simulated={simulated} />
        </section>

        <div className="stack">
          <section className="card" id="validations" style={{ scrollMarginTop: 80 }}>
            <h2>Validations en attente</h2>
            <ApprovalsPanel approvals={listApprovals()} canDecide={founder} authEnabled={cfg.authEnabled} />
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Missions en cours et à venir</h2>
              <Link href="/missions" className="btn secondary small">Toutes</Link>
            </div>
            {active.length === 0 ? <EmptyState>Aucune mission active.</EmptyState> : (
              <ul className="list">
                {active.slice(0, 10).map((m) => (
                  <li key={m.id} className="row">
                    <Link href={`/missions/${m.id}`}>{m.title}</Link>
                    <ProvenanceTag provenance={m.provenance} />
                    <span className="spacer" />
                    <span className="id">{m.assignedPositionId ?? "—"}</span>
                    <MissionStatusBadge status={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>Rapports et historique</h2>
            <p className="muted">Les comptes rendus détaillés sont disponibles dans les rapports et le journal des événements.</p>
            <div className="row">
              <Link href="/rapports" className="btn secondary small">Rapports</Link>
              <Link href="/historique" className="btn secondary small">Historique</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
