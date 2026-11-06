"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="icon-btn"
      title="Fondateur connecté — se déconnecter"
      aria-label="Se déconnecter"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/connexion");
        router.refresh();
      }}
    >
      <Icon name="user" />
    </button>
  );
}
