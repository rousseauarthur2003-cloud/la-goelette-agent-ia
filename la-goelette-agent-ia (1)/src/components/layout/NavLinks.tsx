"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

const LINKS: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/entreprise", label: "Entreprise", icon: "building" },
  { href: "/siege", label: "Siège virtuel", icon: "map" },
  { href: "/departements", label: "Départements", icon: "grid" },
  { href: "/agents", label: "Agents", icon: "users" },
  { href: "/missions", label: "Missions", icon: "flag" },
  { href: "/rapports", label: "Rapports", icon: "chart" },
  { href: "/historique", label: "Historique", icon: "clock" },
  { href: "/parametres", label: "Paramètres", icon: "gear" },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="nav" aria-label="Navigation principale">
      {LINKS.map((l, i) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <div key={l.href}>
            {i === 3 ? <div className="nav-sep" /> : null}
            <Link
              href={l.href}
              className={`nav-link${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
              title={l.label}
              onClick={onNavigate}
            >
              <Icon name={l.icon} />
              <span>{l.label}</span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
