"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Rafraîchissement périodique (polling) des données serveur, sans WebSocket. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
