import { Children, isValidElement, type AnchorHTMLAttributes, type ReactNode } from "react";
import { PinnableImage } from "./PinnableImage";

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
//
// Cas spécial — images épinglables Pinterest :
//   Le MDX `[![alt](img)](https://www.pinterest.com/pin/create/...)` rend une
//   ancre `pinterest.com/pin/create` enveloppant un <img>. On la délègue à
//   <PinnableImage> pour restaurer le bouton « Épingler » au survol (le widget
//   JS officiel pinit.js est bloqué par la CSP `script-src 'self'`).
// ─────────────────────────────────────────────────────────────────────────────

const AFFILIATE_HOSTS = ["c3po.link", "fnty.co"] as const;
const INTERNAL_HOSTS = ["vegourmet.fr", "www.vegourmet.fr"] as const;

/** Vrai si l'URL est un lien de création de pin Pinterest. */
function isPinterestCreateUrl(href: string | undefined): boolean {
  if (!href) return false;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  const hostname = url.hostname.toLowerCase();
  const isPinterestHost =
    hostname === "pinterest.com" || hostname.endsWith(".pinterest.com");
  return isPinterestHost && url.pathname.startsWith("/pin/create");
}

/** Extrait { src, alt } si les enfants se réduisent à un unique <img>. */
function extractSingleImage(
  children: ReactNode,
): { src: string; alt: string } | null {
  const arr = Children.toArray(children);
  if (arr.length !== 1) return null;
  const only = arr[0];
  if (!isValidElement(only) || only.type !== "img") return null;
  const props = only.props as { src?: string; alt?: string };
  if (!props.src) return null;
  return { src: props.src, alt: props.alt ?? "" };
}

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
  // Image épinglable Pinterest → bouton « Épingler » au survol (CSP-safe).
  if (isPinterestCreateUrl(href)) {
    const img = extractSingleImage(children);
    if (img) {
      return <PinnableImage pinUrl={href as string} imgSrc={img.src} imgAlt={img.alt} />;
    }
  }

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
