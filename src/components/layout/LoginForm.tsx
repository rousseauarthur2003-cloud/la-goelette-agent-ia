"use client";

import { useState } from "react";

export function LoginForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="stack"
      style={{ gap: 10 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError(null);
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          window.location.href = next;
          return;
        }
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Connexion impossible.");
        setBusy(false);
      }}
    >
      <div className="field">
        <label htmlFor="password">Mot de passe</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error ? <div className="alert error" role="alert">{error}</div> : null}
      <button className="btn" type="submit" disabled={busy || !password}>{busy ? "Connexion…" : "Se connecter"}</button>
    </form>
  );
}
