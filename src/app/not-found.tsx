import Link from "next/link";

export default function NotFound() {
  return (
    <div className="content">
      <div className="card" style={{ maxWidth: 560 }}>
        <h1>Page introuvable</h1>
        <p className="muted">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="btn">Retour au tableau de bord</Link>
      </div>
    </div>
  );
}
