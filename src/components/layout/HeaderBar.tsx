import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LogoutButton } from "./LogoutButton";

export interface HeaderData {
  mode: "demo" | "connected";
  working: number;
  available: number;
  inProgress: number;
  notifications: number;
  alerts: number;
  isFounder: boolean;
  authEnabled: boolean;
}

/** En-tête : état global, agents réellement actifs, missions, notifications, CEO, profil. */
export function HeaderBar({ data }: { data: HeaderData }) {
  const health = data.alerts > 0 ? { color: "var(--coral)", label: `${data.alerts} alerte${data.alerts > 1 ? "s" : ""}` } : { color: "var(--success)", label: "Système opérationnel" };
  return (
    <>
      <div className="header-stats">
        <span className="chip health" title="État global">
          <span className="dot" style={{ background: health.color }} />
          {health.label}
        </span>
        <span className={`badge ${data.mode === "demo" ? "demo" : "success"}`}>
          {data.mode === "demo" ? "Mode démonstration" : "Connecté"}
        </span>
        <Link href="/agents?etat=working" className="chip" title="Agents dont une exécution réelle est en cours (heartbeat récent)">
          <span className="dot" style={{ background: "var(--success)" }} />
          <strong>{data.working}</strong> en exécution réelle
        </Link>
        <Link href="/missions?statut=in_progress" className="chip optional">
          <strong>{data.inProgress}</strong> mission{data.inProgress > 1 ? "s" : ""} en cours
        </Link>
      </div>
      <div className="header-actions">
        <Link href="/ceo#validations" className="icon-btn" aria-label={`Notifications : ${data.notifications}`} title="Validations en attente et alertes">
          <Icon name="bell" />
          {data.notifications > 0 ? <span className="badge-count">{data.notifications}</span> : null}
        </Link>
        <Link href="/ceo" className="btn accent small" title="Espace CEO">
          <Icon name="ceo" size={16} />
          <span>CEO</span>
        </Link>
        {data.isFounder ? (
          <LogoutButton />
        ) : (
          <Link
            href={data.authEnabled ? "/connexion" : "/parametres#acces"}
            className="icon-btn"
            aria-label="Profil et paramètres"
            title={data.authEnabled ? "Se connecter" : "Profil et paramètres"}
          >
            <Icon name="user" />
          </Link>
        )}
      </div>
    </>
  );
}
