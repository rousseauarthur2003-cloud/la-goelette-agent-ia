"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { NavLinks } from "./NavLinks";
import { Icon } from "@/components/ui/Icon";

/** Coquille responsive : barre latérale (ordinateur), repliée (tablette), tiroir (mobile). */
export function AppShell({
  appName,
  modeLabel,
  header,
  banners,
  children,
}: {
  appName: string;
  modeLabel: string;
  header: ReactNode;
  banners: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`shell${open ? " nav-open" : ""}`}>
      <aside className="sidebar" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="brand">
          <Link href="/" className="brand-name" onClick={() => setOpen(false)}>
            {appName}
          </Link>
          <span className="brand-sub">Siège virtuel · agents IA</span>
        </div>
        <NavLinks onNavigate={() => setOpen(false)} />
        <div className="sidebar-foot">{modeLabel}</div>
      </aside>
      <div className="main">
        <header className="header">
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} />
          </button>
          {header}
        </header>
        {banners}
        {children}
      </div>
    </div>
  );
}
