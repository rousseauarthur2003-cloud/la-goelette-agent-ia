import type { Metadata } from "next";
import { getSnapshot, listEvents, listApprovals } from "@/server/store";
import { HQView } from "@/components/hq/HQView";

export const metadata: Metadata = { title: "Siège virtuel" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function HQPage({ searchParams }: Props) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const snap = getSnapshot();
  return (
    <HQView
      initialSnapshot={snap}
      initialEvents={listEvents({ limit: 15 })}
      pendingApprovals={listApprovals("pending").length}
      focus={{ positionId: one(sp.poste).toUpperCase() || null, departmentId: one(sp.salle).toUpperCase() || null }}
    />
  );
}
