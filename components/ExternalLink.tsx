import type { AnchorHTMLAttributes } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Composant <a> custom injecté dans MDXRemote (P1-1 audit Galahad).
//
// Règles SEO/sécurité appliquées aux liens du corps éditorial :
//   - Liens vers les domaines AFFILIÉS (c3po.link, fnty.co) :
//       rel="sponsored nofollow noopener noreferrer"
//     → conformité Google (liens monétisés) + sécurité (noopener/noreferrer).
//   - Tout autre lien EXTERNE (http/https vers un autre domaine) :
//       rel="noopener noreferrer"
//   - Liens INTERNES (ancre, relatif, vegourmet.fr) : inchangés.
// ─────────────────────────────────────────────────────────────────────────────

const AFFILIATE_HOSTS = ["c3po.link", "fnty.co"] as const;
const INTERNAL_HOSTS = ["vegourmet.fr", "www.vegourmet.fr"] as const;

function isHost(hostname: string, host: string): boolean {
  return hostname === host || hostname.endsWith(`.${host}`);
}

type LinkClassification = "affiliate" | "external" | "internal";

function classifyHref(href: string | undefined): LinkClassification {
  if (!href) return "internal";

  // Ancres et liens relatifs → internes.
  if (href.startsWith("#") || href.startsWith("/")) return "internal";

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    // Non parsable (ex. mailto:, tel:, relatif sans schéma) → traité comme interne.
    return "internal";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return "internal";

  const hostname = url.hostname.toLowerCase();

  if (AFFILIATE_HOSTS.some((h) => isHost(hostname, h))) return "affiliate";
  if (INTERNAL_HOSTS.some((h) => isHost(hostname, h))) return "internal";

  return "external";
}

export function ExternalLink({
  href,
  children,
  rel: relProp,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const classification = classifyHref(href);

  let rel = relProp;
  if (classification === "affiliate") {
    rel = "sponsored nofollow noopener noreferrer";
  } else if (classification === "external") {
    rel = "noopener noreferrer";
  }

  return (
    <a href={href} rel={rel} {...rest}>
      {children}
    </a>
  );
}
