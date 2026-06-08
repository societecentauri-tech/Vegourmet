import type { ReactNode } from "react";
import "./callout.css";

export type CalloutVariant = "primary" | "secondary";

export interface CalloutProps {
  /** Couleur de l'encart : primary (terracotta) ou secondary (olive). */
  variant?: CalloutVariant;
  children: ReactNode;
}

/**
 * Encart éditorial stylé (panneau Gutenberg vegourmet).
 * Server component pur, sans logique : fond léger + bordure gauche colorée.
 * Rôle `note` pour signaler aux lecteurs d'écran un aparté/encadré.
 */
export function Callout({ variant = "primary", children }: CalloutProps) {
  return (
    <aside className={`vg-callout vg-callout--${variant}`} role="note">
      {children}
    </aside>
  );
}
