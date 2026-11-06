"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MissionStatus } from "@/types/domain";
import { MISSION_STATUS_LABELS } from "@/lib/labels";

const ACTION_LABELS: Partial<Record<MissionStatus, string>> = {
  pending: "Passer en attente",
  assigned: "Marquer comme affectée",
  draft: "Repasser en brouillon",
  completed: "Marquer comme terminée",
  failed: "Marquer en erreur",
  cancelled: "Annuler la mission",
};

export function MissionActions({
  missionId,
  status,
  allowed,
  positions,
  currentPosition,
}: {
  missionId: string;
  status: MissionStatus;
  allowed: MissionStatus[];
  positions: Array<{ id: string; title: string }>;
  currentPosition: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(currentPosition ?? "");
  const [comment, setComment] = useState("");

  async function patch(body: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/missions/${missionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setComment("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const canAssign = !["completed", "cancelled", "in_progress"].includes(status);

  return (
    <div className="stack" style={{ gap: 12 }}>
      {error ? <div className="alert error" role="alert">{error}</div> : null}
      {allowed.length > 0 ? (
        <div className="row">
          {allowed.map((s) => (
            <button
              key={s}
              type="button"
              className={`btn small ${s === "cancelled" || s === "failed" ? "secondary" : ""}`}
              disabled={busy}
              onClick={() => {
                if (s === "cancelled" && !window.confirm("Annuler cette mission ?")) return;
                patch({ action: "status", status: s });
              }}
            >
              {ACTION_LABELS[s] ?? MISSION_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ fontSize: "0.88rem" }}>Aucune transition manuelle possible depuis ce statut.</p>
      )}
      {canAssign ? (
        <div className="row">
          <select aria-label="Poste responsable" value={position} onChange={(e) => setPosition(e.target.value)} style={{ maxWidth: 320 }}>
            <option value="">Choisir un poste…</option>
            {positions.map((p) => <option key={p.id} value={p.id}>{p.id} — {p.title}</option>)}
          </select>
          <button className="btn secondary small" type="button" disabled={busy || !position || position === currentPosition} onClick={() => patch({ action: "assign", positionId: position })}>
            Affecter
          </button>
        </div>
      ) : null}
      <form
        className="stack"
        style={{ gap: 6 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (comment.trim()) patch({ action: "comment", body: comment });
        }}
      >
        <label htmlFor="comment">Ajouter un commentaire ou une demande de correction</label>
        <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} style={{ minHeight: 70 }} />
        <div><button className="btn secondary small" type="submit" disabled={busy || !comment.trim()}>Commenter</button></div>
      </form>
    </div>
  );
}
