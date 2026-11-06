import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { getConfig } from "@/server/config";
import { getSnapshot, hasDemoData } from "@/server/store";
import { isFounderSession } from "@/server/session";

// Les données vivent en mémoire côté serveur : chaque page est rendue à la demande.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "La Goélette — Siège virtuel", template: "%s · La Goélette" },
  description: "Entreprise virtuelle pilotée par des agents IA, avec siège social en pixel art.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#263B56",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cfg = getConfig();
  const snap = getSnapshot();
  const isFounder = await isFounderSession();
  const alerts = snap.positions.filter((p) => p.deskState === "error" || p.deskState === "unknown").length + snap.missions.failed;
  const demo = hasDemoData();

  return (
    <html lang="fr">
      <body>
        <AppShell
          appName={cfg.appName}
          modeLabel={`${cfg.mode === "demo" ? "Mode démonstration" : "Mode connecté"} · stockage en mémoire`}
          header={
            <HeaderBar
              data={{
                mode: cfg.mode,
                working: snap.totals.working,
                available: snap.totals.available,
                inProgress: snap.missions.in_progress,
                notifications: snap.pendingApprovals + alerts,
                alerts,
                isFounder,
                authEnabled: cfg.authEnabled,
              }}
            />
          }
          banners={
            <>
              {demo ? (
                <div className="banner" role="note">
                  <strong>Démonstration</strong>
                  <span>
                    Les agents, missions et validations marqués « Démonstration » sont fictifs. Aucun modèle IA n&apos;est
                    appelé et aucune action externe n&apos;est réalisée. Les données sont conservées en mémoire et
                    disparaissent au redémarrage du serveur.
                  </span>
                </div>
              ) : null}
              {!cfg.authEnabled ? (
                <div className="banner danger" role="note">
                  <strong>Accès non protégé</strong>
                  <span>
                    Aucun mot de passe fondateur n&apos;est configuré : ne pas utiliser ce prototype pour des opérations
                    sensibles. Les validations et changements de permissions sont désactivés.{" "}
                    <a href="/parametres#acces">Voir comment l&apos;activer</a>.
                  </span>
                </div>
              ) : null}
            </>
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
