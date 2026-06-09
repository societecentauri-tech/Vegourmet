import Link from "next/link";

/** Photo de Chloé (CDN static.vegourmet.fr). */
const CHLOE_PHOTO = "https://static.vegourmet.fr/hero/a-propos.jpg";

/** Réseaux sociaux officiels Vegourmet (attestés dans le rendu réel). */
const SOCIALS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61568255593913",
    icon: (
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/VegourmetOff",
    icon: (
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/vegourmetoff/",
    icon: (
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.8c-3.15 0-3.52.01-4.76.07-.94.04-1.45.2-1.79.33-.45.18-.77.39-1.11.73-.34.34-.55.66-.73 1.11-.13.34-.29.85-.33 1.79-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.94.2 1.45.33 1.79.18.45.39.77.73 1.11.34.34.66.55 1.11.73.34.13.85.29 1.79.33 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.94-.04 1.45-.2 1.79-.33.45-.18.77-.39 1.11-.73.34-.34.55-.66.73-1.11.13-.34.29-.85.33-1.79.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.94-.2-1.45-.33-1.79a2.98 2.98 0 0 0-.73-1.11 2.98 2.98 0 0 0-1.11-.73c-.34-.13-.85-.29-1.79-.33-1.24-.06-1.61-.07-4.76-.07Zm0 3.06a4.98 4.98 0 1 1 0 9.96 4.98 4.98 0 0 1 0-9.96Zm0 8.22a3.24 3.24 0 1 0 0-6.48 3.24 3.24 0 0 0 0 6.48Zm6.34-8.42a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0Z" />
    ),
  },
  {
    label: "Pinterest",
    href: "https://fr.pinterest.com/vegourmetoff/",
    icon: (
      <path d="M12 2.04C6.48 2.04 2 6.52 2 12.04c0 4.24 2.64 7.86 6.36 9.32-.09-.79-.17-2.01.03-2.88.18-.78 1.18-4.97 1.18-4.97s-.3-.6-.3-1.49c0-1.4.81-2.44 1.82-2.44.86 0 1.27.64 1.27 1.42 0 .86-.55 2.15-.83 3.35-.24 1 .5 1.82 1.49 1.82 1.79 0 3.16-1.89 3.16-4.61 0-2.41-1.73-4.1-4.21-4.1-2.87 0-4.55 2.15-4.55 4.37 0 .87.33 1.8.75 2.31.08.1.09.19.07.29-.08.32-.25 1-.28 1.14-.04.18-.15.22-.34.13-1.26-.59-2.05-2.43-2.05-3.91 0-3.18 2.31-6.1 6.66-6.1 3.5 0 6.22 2.49 6.22 5.82 0 3.48-2.19 6.28-5.24 6.28-1.02 0-1.98-.53-2.31-1.16l-.63 2.4c-.23.88-.85 1.98-1.26 2.65.95.29 1.95.45 3 .45 5.52 0 10-4.48 10-10S17.52 2.04 12 2.04Z" />
    ),
  },
];

/**
 * AboutChloe — section « À propos de moi » (#about_section).
 * Fond tan, 2 colonnes : texte (bio + réseaux sociaux + bouton) à gauche,
 * photo de Chloé à droite. Bio fidèle au rendu officiel vegourmet.fr.
 */
export function AboutChloe() {
  return (
    <section
      id="about_section"
      className="vgh-about"
      aria-labelledby="vgh-about-title"
    >
      <div className="vgh-container vgh-about-grid">
        <div className="vgh-about-text">
          <h2 id="vgh-about-title">À propos de moi</h2>
          <p>
            <strong>Bonjour, je suis Chloé !</strong>
          </p>
          <p>
            Créatrice de Vegourmet, je vis à Lyon avec Julien et Miso, entre
            séances de yoga et sessions fourneaux. Mon truc ? Prouver qu&apos;on
            peut cuisiner vegan sans se prendre la tête, avec de vrais plats
            généreux qui font du bien.
          </p>
          <p>
            Devenue vegan en 2018, j&apos;ai décidé de prouver une chose :
            qu&apos;on peut se régaler sans produits animaux, sans se prendre la
            tête, et surtout sans renoncer au plaisir. Ici, pas de cuisine
            compliquée ni d&apos;ingrédients impossibles à trouver. Juste des
            recettes généreuses, accessibles, et testées (au moins trois fois
            avant de les partager !).
          </p>

          <div className="vgh-about-social">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label={social.label}
                title={social.label}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  {social.icon}
                </svg>
              </a>
            ))}
          </div>

          <Link href="/a-propos/" className="btn-primary">
            En savoir plus sur moi
          </Link>
        </div>

        <div className="vgh-about-photo">
          <img
            src={CHLOE_PHOTO}
            alt="Chloé, créatrice de Vegourmet"
            width={541}
            height={623}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
