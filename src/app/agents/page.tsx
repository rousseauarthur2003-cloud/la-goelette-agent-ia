import type { Metadata } from "next";
import { getSnapshot } from "@/server/store";
import { DEPARTMENTS } from "@/lib/organization";
import { AgentsBrowser, type AgentRow } from "@/components/agents/AgentsBrowser";

export const metadata: Metadata = { title: "Agents" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AgentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rows: AgentRow[] = getSnapshot().positions.map((v) => ({
    positionId: v.position.id,
    title: v.position.title,
    departmentId: v.position.departmentId,
    departmentName: v.department.name,
    departmentColor: v.department.color,
    agentName: v.agent?.name ?? null,
    demo: v.agent?.provenance === "demo",
    state: v.deskState,
    skills: v.position.skills,
    mission: v.currentMission ? { id: v.currentMission.id, title: v.currentMission.title } : null,
  }));
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Agents et postes</h1>
          <p>
            Les 50 postes de l&apos;organigramme et les agents qui y sont affectés. L&apos;état « En exécution » n&apos;apparaît
            que lorsqu&apos;une exécution réelle est en cours.
          </p>
        </div>
      </div>
      <AgentsBrowser
        rows={rows}
        departments={DEPARTMENTS.map((d) => ({ id: d.id, name: d.name }))}
        initial={{ q: one(sp.q), dept: one(sp.departement), state: one(sp.etat) }}
      />
    </div>
  );
}
