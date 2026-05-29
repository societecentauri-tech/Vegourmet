interface JsonLdProps {
  data: Record<string, unknown>;
}

/** Injecte un bloc JSON-LD schema.org dans le <head> via script SSR. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Sérialisation contrôlée d'un objet construit côté serveur (pas d'entrée utilisateur).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
