import type { ReactNode } from "react";
import type { DeskState, MissionStatus, Provenance } from "@/types/domain";
import { DESK_STATE_COLORS, DESK_STATE_LABELS } from "@/lib/status";
import { MISSION_STATUS_LABELS, MISSION_STATUS_TONE, PROVENANCE_LABELS } from "@/lib/labels";

export function Badge({ tone = "neutral", children, title }: { tone?: string; children: ReactNode; title?: string }) {
  return (
    <span className={`badge ${tone}`} title={title}>
      {children}
    </span>
  );
}

export function DeskStateBadge({ state }: { state: DeskState }) {
  return (
    <span className="badge neutral">
      <span className="dot" style={{ background: DESK_STATE_COLORS[state] }} />
      {DESK_STATE_LABELS[state]}
    </span>
  );
}

export function MissionStatusBadge({ status }: { status: MissionStatus }) {
  return <Badge tone={MISSION_STATUS_TONE[status]}>{MISSION_STATUS_LABELS[status]}</Badge>;
}

/** Mention de provenance (Annexe B) : affichée pour tout ce qui n'est pas une donnée réelle. */
export function ProvenanceTag({ provenance, always = false }: { provenance: Provenance; always?: boolean }) {
  if (provenance === "real" && !always) return null;
  return (
    <Badge tone={provenance === "demo" ? "demo" : provenance === "real" ? "real" : "estimate"} title="Origine de la donnée">
      {PROVENANCE_LABELS[provenance]}
    </Badge>
  );
}

export function DeptSwatch({ color }: { color: string }) {
  return <span className="dept-swatch" style={{ background: color }} aria-hidden />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
