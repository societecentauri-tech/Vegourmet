"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

/** Menu mobile interactif : bouton hamburger + tiroir latéral à état.
 *  Remplace le bouton inerte de l'ancien header (le hamburger n'ouvrait rien). */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le tiroir à chaque navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Verrouille le scroll du body quand le tiroir est ouvert + Échap pour fermer
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`mobile-toggle${open ? " is-open" : ""}`}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      {/* Overlay */}
      <div
        className={`mobile-overlay${open ? " is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Tiroir */}
      <nav
        id="mobile-drawer"
        className={`mobile-drawer${open ? " is-open" : ""}`}
        aria-label="Navigation mobile"
        aria-hidden={!open}
      >
        <div className="mobile-drawer-head">
          <span className="mobile-drawer-title">Menu</span>
          <button
            type="button"
            className="mobile-drawer-close"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
        <ul className="mobile-menu">
          {NAV_ITEMS.map((item) => (
            <li key={item.href} className="mobile-menu-item">
              <Link href={item.href} className="mobile-menu-link">
                {item.label}
              </Link>
              {item.children ? (
                <ul className="mobile-submenu">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <Link href={child.href} className="mobile-submenu-link">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
