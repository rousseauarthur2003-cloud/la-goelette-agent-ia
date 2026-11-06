"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CeoMessage, Proposal } from "@/server/store";
import { APPROVAL_ACTION_LABELS, PRIORITY_LABELS, formatDateTime } from "@/lib/labels";

const EXAMPLES = [
  "Attirer plus de clients le midi en semaine grâce à Instagram et Facebook",
  "Préparer la communication du menu de fin d'année",
  "Améliorer nos réponses aux avis clients",
];

export function CeoSpace({
  initialMessages,
  initialProposals,
  simulated,
}: {
  initialMessages: CeoMessage[];
  initialProposals: Proposal[];
  simulated: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [proposals, setProposals] = useState(initialProposals);
  const [objective, setObjective] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, number[]>>({});
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  async function reload() {
    const res = await fetch("/api/ceo", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setProposals(data.proposals);
    }
  }

  async function send() {
    if (busy || objective.trim().length < 5) return;
    setBusy(true);
    setError(null);
    setWarning(null);
    try {
      const res = await fetch("/api/ceo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ objective }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setWarning(data.warning);
      setObjective("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function decide(p: Proposal, action: "accept" | "dismiss") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ceo/proposals/${p.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, taskIndexes: selection[p.id] ?? p.tasks.map((_, i) => i) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      await reload();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const toggle = (p: Proposal, i: number) => {
    const current = selection[p.id] ?? p.tasks.map((_, k) => k);
    setSelection({ ...selection, [p.id]: current.includes(i) ? current.filter((k) => k !== i) : [...current, i].sort() });
  };

  const proposalById = new Map(proposals.map((p) => [p.id, p]));

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="chat" ref={chatRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty">
            Aucun échange pour l&apos;instant. Confiez un objectif au CEO.
            {simulated ? <div style={{ marginTop: 6 }}><small>Le CEO est simulé : il applique des règles, il ne « pense » pas.</small></div> : null}
          </div>
        ) : null}
        {messages.map((m) => {
          const p = m.proposalId ? proposalById.get(m.proposalId) : undefined;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column" }}>
              <div className={`msg ${m.role}`}>
                {m.content}
                <div className="msg-meta">
                  {m.role === "founder" ? "Vous" : m.source === "ai" ? "CEO IA" : "CEO simulé (règles)"} · {formatDateTime(m.createdAt)}
                </div>
              </div>
              {p ? (
                <div className="proposal" style={{ marginTop: 8 }}>
                  <div className="row">
                    <strong>Proposition {p.id}</strong>
                    <span className={`badge ${p.source === "ai" ? "info" : "demo"}`}>{p.source === "ai" ? "Générée par IA" : "Règles de démonstration"}</span>
                    <span className="spacer" />
                    <span className={`badge ${p.status === "accepted" ? "success" : p.status === "dismissed" ? "neutral" : "warning"}`}>
                      {p.status === "accepted" ? "Acceptée" : p.status === "dismissed" ? "Écartée" : "À décider"}
                    </span>
                  </div>
                  <ol>
                    {p.tasks.map((t, i) => (
                      <li key={i}>
                        <label className="row" style={{ fontWeight: 400, alignItems: "flex-start", gap: 6 }}>
                          {p.status === "proposed" ? (
                            <input
                              type="checkbox"
                              style={{ width: "auto", marginTop: 3 }}
                              checked={(selection[p.id] ?? p.tasks.map((_, k) => k)).includes(i)}
                              onChange={() => toggle(p, i)}
                            />
                          ) : null}
                          <span>
                            <strong>{t.title}</strong> — <span className="id">{t.positionId}</span> · {PRIORITY_LABELS[t.priority]}
                            <br />
                            <small>Livrable : {t.deliverable}</small>
                            {t.approvalType ? <><br /><span className="badge warning">Validation requise : {APPROVAL_ACTION_LABELS[t.approvalType]}</span></> : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ol>
                  {p.status === "proposed" ? (
                    <div className="row">
                      <button className="btn small" type="button" disabled={busy} onClick={() => decide(p, "accept")}>Créer les missions sélectionnées</button>
                      <button className="btn secondary small" type="button" disabled={busy} onClick={() => decide(p, "dismiss")}>Écarter</button>
                    </div>
                  ) : p.missionIds.length ? (
                    <small>Missions créées : {p.missionIds.map((id, k) => <span key={id}>{k ? ", " : ""}<Link href={`/missions/${id}`}>{id}</Link></span>)}</small>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {warning ? <div className="alert info">{warning}</div> : null}
      {error ? <div className="alert error" role="alert">{error}</div> : null}
      <form
        className="stack"
        style={{ gap: 6 }}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="objective">Nouvel objectif pour le CEO</label>
        <textarea id="objective" value={objective} onChange={(e) => setObjective(e.target.value)} maxLength={1500} placeholder="Décrivez ce que vous souhaitez obtenir…" />
        <div className="row">
          <button className="btn" type="submit" disabled={busy || objective.trim().length < 5}>{busy ? "Traitement…" : "Envoyer au CEO"}</button>
          <span className="spacer" />
        </div>
        <div className="tags">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="tag" style={{ border: 0, cursor: "pointer" }} onClick={() => setObjective(ex)}>
              {ex}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
