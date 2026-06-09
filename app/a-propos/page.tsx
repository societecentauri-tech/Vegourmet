import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { SmartImage } from "@/components/SmartImage";
import { SocialLinks } from "@/components/SocialLinks";
import { getArticleBySlug } from "@/lib/content";
import { SITE_URL, buildBreadcrumbJsonLd } from "@/lib/seo";
import "@/components/about.css";

const S3 = "https://veg.s3.fr-par.scw.cloud/about";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Bonjour, moi c'est Chloé, créatrice de Vegourmet. Découvre ma philosophie en cuisine et un peu plus sur moi.",
  alternates: { canonical: `${SITE_URL}/a-propos/` },
  openGraph: {
    type: "profile",
    title: "À propos — Vegourmet",
    description: "La créatrice de Vegourmet, sa philosophie et son histoire.",
    url: `${SITE_URL}/a-propos/`,
  },
};

interface Section {
  heading: string;
  body: string;
}

/** Découpe le MDX en sections (## titre + corps), corps nettoyé des images inline
 *  (les photos sont posées dans la mise en page en colonnes, pas en pleine largeur). */
function splitSections(content: string): { preamble: string; sections: Section[] } {
  const parts = content.split(/^## /m);
  const clean = (s: string) =>
    s
      // retire les images inline (placées en colonnes dans la mise en page)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      // retire les puces de liens sociaux (rendues en icônes via <SocialLinks/>)
      .replace(
        /^[-*]\s*\[(?:Facebook|Twitter|X|Instagram|Pinterest|TikTok|YouTube|LinkedIn)\]\([^)]+\)\s*$/gim,
        "",
      )
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  const preamble = clean(parts[0] ?? "");
  const sections = parts.slice(1).map((chunk) => {
    const nl = chunk.indexOf("\n");
    return {
      heading: nl === -1 ? chunk.trim() : chunk.slice(0, nl).trim(),
      body: clean(nl === -1 ? "" : chunk.slice(nl + 1)),
    };
  });
  return { preamble, sections };
}

function find(sections: Section[], re: RegExp): Section | undefined {
  return sections.find((s) => re.test(s.heading));
}

export default async function AProposPage() {
  const article = getArticleBySlug("a-propos");
  if (!article) notFound();

  const { preamble, sections } = splitSections(article.content);
  const intro = find(sections, /bonjour|chlo/i);
  const philosophy = find(sections, /philosophie/i);
  const mission = find(sections, /proposer|simples|accessibles|but/i);
  const more = find(sections, /plus sur moi|parcours/i);

  const breadcrumb = [
    { name: "Accueil", url: `${SITE_URL}/` },
    { name: "À propos", url: `${SITE_URL}/a-propos/` },
  ];

  return (
    <div className="vg-about">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumb)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "À propos — Vegourmet",
          url: `${SITE_URL}/a-propos/`,
          mainEntity: {
            "@type": "Person",
            name: "Chloé",
            jobTitle: "Créatrice de Vegourmet",
            image: `${S3}/chloe-salon.jpg`,
          },
        }}
      />

      <Breadcrumb items={breadcrumb.map((b) => ({ name: b.name, href: b.url.replace(SITE_URL, "") || "/" }))} />

      <header className="about-hero">
        <p className="about-eyebrow">À propos</p>
        <h1 className="about-title">{intro?.heading ?? "Bonjour, moi c'est Chloé !"}</h1>
      </header>

      {/* Bloc 1 : intro + photo principale, en colonnes */}
      <section className="about-row">
        <div className="about-col-text vg-entry-content">
          {preamble ? <MDXRemote source={preamble} /> : null}
          {intro ? <MDXRemote source={intro.body} /> : null}
          <SocialLinks className="about-socials" />
        </div>
        <div className="about-col-media">
          <SmartImage
            src={`${S3}/chloe-salon.jpg`}
            alt="Chloé, créatrice de Vegourmet, dans son salon"
            ratio="4 / 5"
            className="about-photo"
          />
        </div>
      </section>

      {/* Bloc 2 : philosophie, pleine largeur centrée */}
      {philosophy ? (
        <section className="about-band">
          <h2 className="about-h2">{philosophy.heading}</h2>
          <div className="about-prose vg-entry-content">
            <MDXRemote source={philosophy.body} />
          </div>
        </section>
      ) : null}

      {/* Bloc 3 : la mission en accroche mise en avant */}
      {mission ? (
        <section className="about-quote">
          <p>{mission.heading}</p>
          {mission.body ? (
            <div className="about-prose vg-entry-content">
              <MDXRemote source={mission.body} />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Bloc 4 : un peu plus sur moi, photo + texte en colonnes (inversé) */}
      {more ? (
        <section className="about-row is-reverse">
          <div className="about-col-media">
            <SmartImage
              src={`${S3}/chloe-sofa.jpg`}
              alt="Chloé sur son canapé"
              ratio="4 / 5"
              className="about-photo"
            />
          </div>
          <div className="about-col-text vg-entry-content">
            <h2 className="about-h2">{more.heading}</h2>
            <MDXRemote source={more.body} />
          </div>
        </section>
      ) : null}

      {/* Galerie de fin */}
      <section className="about-gallery">
        <SmartImage src={`${S3}/chloe-sofa-bis.jpg`} alt="Chloé souriante" ratio="1 / 1" className="about-photo" />
        <SmartImage src={`${S3}/chloe-sofa-rire.jpg`} alt="Chloé qui rit" ratio="1 / 1" className="about-photo" />
        <SmartImage src={`${S3}/chloe-salon.jpg`} alt="Chloé dans son salon" ratio="1 / 1" className="about-photo" />
      </section>
    </div>
  );
}
