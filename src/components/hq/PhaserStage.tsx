"use client";

import { useEffect, useRef, useState } from "react";
import type { DeskVisual, HQCallbacks, HQController, HQMode } from "@/game/scenes/createHQGame";

/**
 * Monte le moteur Phaser dans le navigateur uniquement.
 * Ce composant est importé avec `ssr: false` : Phaser n'est jamais évalué côté serveur.
 */
export default function PhaserStage({
  mode,
  desks,
  callbacks,
  onController,
}: {
  mode: HQMode;
  desks: DeskVisual[];
  callbacks: HQCallbacks;
  onController: (c: HQController | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ctrl = useRef<HQController | null>(null);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("phaser");
        const Phaser = (mod as { default?: unknown }).default ?? mod;
        const { createHQGame } = await import("@/game/scenes/createHQGame");
        if (cancelled || !ref.current) return;
        ctrl.current = createHQGame(Phaser, ref.current, mode, {
          onSelectDesk: (id) => cbRef.current.onSelectDesk(id),
          onSelectRoom: (z, d) => cbRef.current.onSelectRoom(z, d),
          onSelectCeo: () => cbRef.current.onSelectCeo(),
          onHint: (h) => cbRef.current.onHint(h),
          onReady: () => {
            if (!cancelled) setStatus("ready");
            cbRef.current.onReady();
          },
        });
        ctrl.current.setDesks(desks);
        onController(ctrl.current);
      } catch (err) {
        console.error("[siège] échec du chargement de Phaser", err instanceof Error ? err.message : err);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      ctrl.current?.destroy();
      ctrl.current = null;
      onController(null);
    };
    // Montage unique : les mises à jour passent par le contrôleur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ctrl.current?.setDesks(desks);
  }, [desks]);

  useEffect(() => {
    ctrl.current?.setMode(mode);
    if (mode === "game") ref.current?.focus();
  }, [mode]);

  return (
    <>
      <div ref={ref} className="hq-canvas" tabIndex={0} aria-label="Carte du siège : cliquez puis utilisez le clavier en mode jeu" />
      {status === "loading" ? <div className="hq-loading">Chargement du siège…</div> : null}
      {status === "error" ? (
        <div className="hq-loading" role="alert">
          La carte 2D n&apos;a pas pu se charger sur cet appareil.
          <small>Utilisez la vue en liste ; les pages de gestion restent disponibles.</small>
        </div>
      ) : null}
    </>
  );
}
