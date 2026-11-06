"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Approval } from "@/types/domain";
import { APPROVAL_ACTION_LABELS, APPROVAL_STATUS_LABELS, RISK_LABELS, formatDateTime } from "@/lib/labels";

/** Validations : seules les décisions du fondateur authentifié sont acceptées par le serveur. */
export function ApprovalsPanel({ approvals, canDecide, authEnabled }: { approvals: Approval[]; canDecide: boolean; authEnabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const pending = approvals.filter((a) => a.status === "pending");
  const done = approvals.filter((a) => a.status !== "pending").slice(0, 5);

  async function decide(id: string, decision: "approved" | "rejected") {
    if (busy) return;
    if (!window.confirm(decision === "approved" ? "Confirmer l'approbation ?" : "Confirmer le rejet ?")) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, comment: comments[id] ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      {!canDecide ? (
        <div className="alert info">
          {authEnabled
            ? "Connectez-vous en tant que fondateur pour décider."
            : "Décisions désactivées : aucun mot de passe fondateur n'est configuré (FOUNDER_PASSWORD). Voir Paramètres."}
        </div>
      ) : null}
      {error ? <div className="alert error" role="alert">{error}</div> : null}
      {pending.length === 0 ? <div className="empty">Aucune validation en attente.</div> : null}
      {pending.map((a) => (
        <div key={a.id} className="proposal">
          <div className="row">
            <span className="badge warning">{APPROVAL_ACTION_LABELS[a.actionType]}</span>
            <span className="badge neutral">Risque {RISK_LABELS[a.riskLevel].toLowerCase()}</span>
            {a.provenance === "demo" ? <span className="badge demo">Démonstration</span> : null}
          </div>
          <p style={{ margin: "8px 0 4px", fontWeight: 600 }}>{a.description}</p>
          <small>Conséquences : {a.consequences}</small>
          <br />
          <small>Demandée par {a.requestedBy} · {formatDateTime(a.requestedAt)}{a.missionId ? ` · mission ${a.missionId}` : ""}</small>
          {canDecide ? (
            <div className="stack" style={{ gap: 6, marginTop: 8 }}>
              <input
                aria-label="Commentaire de décision"
                placeholder="Commentaire (facultatif)"
                value={comments[a.id] ?? ""}
                onChange={(e) => setComments({ ...comments, [a.id]: e.target.value })}
                maxLength={1000}
              />
              <div className="row">
                <button className="btn small" type="button" disabled={busy === a.id} onClick={() => decide(a.id, "approved")}>Approuver</button>
                <button className="btn secondary small" type="button" disabled={busy === a.id} onClick={() => decide(a.id, "rejected")}>Rejeter</button>
              </div>
            </div>
          ) : null}
        </div>
      ))}
      {done.length > 0 ? (
        <details>
          <summary style={{ cursor: "pointer", fontSize: "0.88rem" }}>Décisions récentes</summary>
          <ul className="list">
            {done.map((a) => (
              <li key={a.id}>
                <strong>{APPROVAL_STATUS_LABELS[a.status]}</strong> — {a.description}
                <br />
                <small>par {a.decidedBy} · {formatDateTime(a.decidedAt)}{a.decisionComment ? ` · « ${a.decisionComment} »` : ""}</small>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
