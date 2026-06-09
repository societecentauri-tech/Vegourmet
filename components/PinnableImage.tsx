import Image from "next/image";
import "./pinnable.css";

// ─────────────────────────────────────────────────────────────────────────────
// Image épinglable Pinterest (CSP-safe, sans script tiers).
//
// Rend une <figure class="vg-pinnable"> qui reproduit le comportement du widget
// Pinterest officiel (data-pin-do="buttonPin" + pinit.js), bloqué par la CSP
// `script-src 'self'` du site :
//   - l'image reste cliquable (lien vers l'URL `pinterest.com/pin/create`),
//     comme sur l'ancien site WordPress ;
//   - un bouton « Épingler » apparaît en overlay au survol (desktop) / en
//     permanence sur mobile (cf. components/pinnable.css).
//
// Utilisé via ExternalLink, qui détecte les ancres `pinterest.com/pin/create`
// enveloppant une image dans le corps éditorial MDX (134 recettes concernées).
// ─────────────────────────────────────────────────────────────────────────────

const PIN_REL = "sponsored nofollow noopener noreferrer";

interface PinnableImageProps {
  /** URL `https://www.pinterest.com/pin/create/button/?...` extraite de l'ancre MDX. */
  pinUrl: string;
  /** Source de l'image (S3) extraite du `<img>` enfant. */
  imgSrc: string;
  /** Texte alternatif de l'image. */
  imgAlt?: string;
}

/** Icône Pinterest (officielle, simplifiée) pour le bouton « Épingler ». */
function PinIcon() {
  return (
    <svg
      className="vg-pin-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12c0 4.9 2.9 9.1 7.1 11-.1-.9-.2-2.3 0-3.3.2-.9 1.3-5.5 1.3-5.5s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.4-1 3.8-.3 1.1.6 2.1 1.7 2.1 2 0 3.6-2.1 3.6-5.2 0-2.7-2-4.6-4.8-4.6-3.3 0-5.2 2.4-5.2 5 0 1 .4 2 .9 2.6.1.1.1.2.1.3-.1.4-.3 1.1-.3 1.3-.1.2-.2.3-.4.2-1.4-.7-2.3-2.7-2.3-4.4 0-3.6 2.6-6.9 7.6-6.9 4 0 7.1 2.8 7.1 6.6 0 4-2.5 7.2-5.9 7.2-1.2 0-2.3-.6-2.6-1.3 0 0-.6 2.2-.7 2.8-.3 1-1 2.2-1.4 3 .9.3 1.9.5 2.9.5 6.6 0 12-5.4 12-12S18.6 0 12 0z" />
    </svg>
  );
}

export function PinnableImage({ pinUrl, imgSrc, imgAlt = "" }: PinnableImageProps) {
  // <span> (display:block) plutôt que <figure> : en MDX l'ancle image vit dans
  // un <p> (contexte phrasing). Un <figure> (bloc) y serait invalide et le
  // navigateur fermerait le <p> prématurément. Un <span> reste valide.
  return (
    <span className="vg-pinnable">
      {/* Image cliquable (vers le pin), fidèle au comportement WordPress. */}
      <a
        className="vg-pin-image-link"
        href={pinUrl}
        target="_blank"
        rel={PIN_REL}
      >
        {/* next/image : AVIF/WebP responsive + width/height anti-CLS.
            Ratio portrait typique WP (1587×2245 ≈ 0,707). Style width:100%/height:auto
            pour laisser le CSS parent fixer la taille réelle. */}
        <Image
          src={imgSrc}
          alt={imgAlt}
          width={760}
          height={1075}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 760px"
          style={{ width: "100%", height: "auto" }}
        />
      </a>

      {/* Bouton « Épingler » en overlay (au survol desktop / permanent mobile). */}
      <a
        className="vg-pin-btn"
        href={pinUrl}
        target="_blank"
        rel={PIN_REL}
        aria-label="Épingler sur Pinterest"
      >
        <PinIcon />
        Épingler
      </a>
    </span>
  );
}
