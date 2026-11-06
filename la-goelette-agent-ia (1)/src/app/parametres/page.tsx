import type { Metadata } from "next";
import { getConfig } from "@/server/config";
import { isFounderSession } from "@/server/session";
import { APPROVAL_ACTION_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Paramètres" };

function Status({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return <span className={`badge ${ok ? "success" : "warning"}`}>{ok ? yes : no}</span>;
}

/**
 * Les réglages sont lus depuis les variables d'environnement du serveur
 * (Hostinger : réglages de l'application Node.js). Aucun secret n'est affiché.
 */
export default async function SettingsPage() {
  const cfg = getConfig();
  const founder = await isFounderSession();
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Paramètres</h1>
          <p>
            État de la configuration. Les réglages se modifient dans les variables d&apos;environnement de l&apos;hébergement
            (aucun secret n&apos;est stocké ni affiché par l&apos;application), puis en redéployant.
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h2>Mode de fonctionnement</h2>
          <dl className="kv">
            <dt>Mode</dt><dd><Status ok={cfg.mode === "connected"} yes="Connecté" no="Démonstration" /> <code>APP_MODE={cfg.mode}</code></dd>
            <dt>Persistance</dt><dd><span className="badge warning">Mémoire du serveur (non persistante)</span></dd>
            <dt>Base de données</dt><dd>{cfg.databaseConfigured ? "DATABASE_URL renseignée, mais la couche PostgreSQL n'est pas encore branchée dans cette version." : "Non configurée (prévue : PostgreSQL, voir db/schema.sql)."}</dd>
            <dt>Temps réel</dt><dd>Interrogation périodique (polling) toutes les 10 à 20 secondes ; aucun WebSocket requis.</dd>
          </dl>
        </section>

        <section className="card" id="acces" style={{ scrollMarginTop: 80 }}>
          <h2>Accès et profil fondateur</h2>
          <dl className="kv">
            <dt>Protection</dt><dd><Status ok={cfg.authEnabled} yes="Mot de passe fondateur actif" no="Aucune protection" /></dd>
            <dt>Session</dt><dd>{founder ? "Vous êtes connecté en tant que fondateur." : "Non connecté."}</dd>
          </dl>
          {!cfg.authEnabled ? (
            <div className="alert info" style={{ marginTop: 12 }}>
              Pour protéger le site : dans Hostinger, ajoutez les variables <code>FOUNDER_PASSWORD</code> (votre mot de
              passe) et <code>AUTH_SECRET</code> (une longue chaîne aléatoire), puis redéployez. Toutes les pages
              demanderont alors la connexion, et les validations seront activées.
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>Intégration IA</h2>
          <dl className="kv">
            <dt>Fournisseur</dt><dd><Status ok={cfg.aiConfigured} yes={`${cfg.aiProvider} configuré`} no="Non configuré" /></dd>
            <dt>Modèle</dt><dd>{cfg.aiModel ? <code>{cfg.aiModel}</code> : "—"}</dd>
            <dt>Utilisation</dt>
            <dd>
              {cfg.mode === "connected" && cfg.aiConfigured
                ? "Le CEO appelle le fournisseur côté serveur pour proposer des plans."
                : "Le CEO utilise le planificateur à règles (simulé et signalé comme tel)."}
            </dd>
          </dl>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 10, marginBottom: 0 }}>
            Implémenté : Anthropic (<code>AI_PROVIDER=anthropic</code>, <code>AI_API_KEY</code>, <code>AI_MODEL</code>).
            Cette intégration n&apos;a pas encore été testée avec une vraie clé. La clé reste exclusivement côté serveur.
          </p>
        </section>

        <section className="card">
          <h2>Agents logiciels</h2>
          <dl className="kv">
            <dt>API agents</dt><dd><Status ok={cfg.agentApiEnabled} yes="Activée (jeton configuré)" no="Désactivée" /></dd>
            <dt>Rôle</dt><dd>Permet à un agent réel de s&apos;enregistrer sur un poste, de démarrer une exécution, d&apos;envoyer des heartbeats et de demander des validations.</dd>
          </dl>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 10, marginBottom: 0 }}>
            Variable : <code>AGENT_API_TOKEN</code> (24 caractères minimum). Documentation : <code>docs/agents/agent-api.md</code>.
          </p>
        </section>

        <section className="card">
          <h2>Règles d&apos;approbation</h2>
          <p className="muted" style={{ fontSize: "0.88rem" }}>Ces actions exigent toujours l&apos;accord explicite du fondateur. Aucun agent ne peut contourner une validation.</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.9rem" }}>
            {Object.values(APPROVAL_ACTION_LABELS).map((l) => <li key={l}>{l}</li>)}
          </ul>
        </section>

        <section className="card">
          <h2>Notifications et préférences</h2>
          <p className="muted" style={{ fontSize: "0.88rem", marginBottom: 0 }}>
            Notifications affichées dans l&apos;en-tête (validations en attente, alertes d&apos;état). L&apos;envoi d&apos;e-mails ou de
            messages n&apos;est pas encore disponible dans cette version. Langue : français. Fuseau : Europe/Paris.
          </p>
        </section>
      </div>
    </div>
  );
}
