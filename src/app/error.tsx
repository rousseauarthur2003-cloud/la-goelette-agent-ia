"use client";

/** Erreur d'affichage : message générique, sans trace interne ni secret. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="content">
      <div className="card" style={{ maxWidth: 560 }}>
        <h1>Un problème est survenu</h1>
        <p className="muted">La page n&apos;a pas pu s&apos;afficher. Vous pouvez réessayer ; si le problème persiste, consultez les journaux du serveur.</p>
        <button className="btn" type="button" onClick={() => reset()}>Réessayer</button>
      </div>
    </div>
  );
}
