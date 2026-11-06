"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/labels";

export function MissionForm({
  departments,
  positions,
  initialDepartment,
  initialPosition,
}: {
  departments: Array<{ id: string; name: string }>;
  positions: Array<{ id: string; title: string; departmentId: string }>;
  initialDepartment: string;
  initialPosition?: string;
}) {
  const router = useRouter();
  const [departmentId, setDepartmentId] = useState(initialDepartment);
  const [positionId, setPositionId] = useState(
    positions.some((p) => p.id === initialPosition && p.departmentId === initialDepartment) ? initialPosition! : "",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          objective: form.get("objective"),
          departmentId,
          positionId: positionId || null,
          priority: form.get("priority"),
          deliverable: form.get("deliverable"),
          dueAt: form.get("dueAt") || null,
          status: form.get("asDraft") ? "draft" : "pending",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      router.push(`/missions/${data.mission.id}`);
      router.refresh();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Erreur" });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div className="field full">
        <label htmlFor="title">Titre *</label>
        <input id="title" name="title" required minLength={3} maxLength={140} placeholder="Ex. : Préparer le calendrier des publications de décembre" />
      </div>
      <div className="field">
        <label htmlFor="m-dept">Département *</label>
        <select id="m-dept" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPositionId(""); }}>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="m-pos">Poste responsable</label>
        <select id="m-pos" value={positionId} onChange={(e) => setPositionId(e.target.value)}>
          <option value="">À affecter plus tard</option>
          {positions.filter((p) => p.departmentId === departmentId).map((p) => (
            <option key={p.id} value={p.id}>{p.id} — {p.title}</option>
          ))}
        </select>
      </div>
      <div className="field full">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" maxLength={2000} />
      </div>
      <div className="field">
        <label htmlFor="objective">Objectif lié</label>
        <input id="objective" name="objective" maxLength={500} />
      </div>
      <div className="field">
        <label htmlFor="deliverable">Livrable attendu</label>
        <input id="deliverable" name="deliverable" maxLength={300} />
      </div>
      <div className="field">
        <label htmlFor="priority">Priorité</label>
        <select id="priority" name="priority" defaultValue="normal">
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="dueAt">Échéance</label>
        <input id="dueAt" name="dueAt" type="date" />
      </div>
      <label className="full row" style={{ fontWeight: 400 }}>
        <input type="checkbox" name="asDraft" style={{ width: "auto" }} /> Enregistrer comme brouillon
      </label>
      {message ? <div className={`alert ${message.kind} full`} role="alert">{message.text}</div> : null}
      <div className="full row">
        <button className="btn" type="submit" disabled={busy}>{busy ? "Création…" : "Créer la mission"}</button>
        <small>La mission est enregistrée en mémoire (non persistante dans cette version).</small>
      </div>
    </form>
  );
}
