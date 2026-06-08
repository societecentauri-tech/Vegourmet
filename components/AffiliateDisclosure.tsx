/**
 * AffiliateDisclosure — encart de divulgation des liens affiliés.
 *
 * Centralise le disclaimer qui était auparavant dupliqué en texte brut dans chaque
 * fiche WP (134 recettes). Câblé une seule fois dans le template recette, sous la
 * fiche RecipeDeliciousCard. Texte en tutoiement, fidèle au sens du disclaimer WP.
 */
export function AffiliateDisclosure() {
  return (
    <aside
      className="vg-affiliate-disclosure"
      role="note"
      aria-label="Divulgation des liens affiliés"
    >
      <p>
        <strong>Liens affiliés</strong> : Certains liens sur ce site sont
        affiliés. Si tu achètes via ces liens, je touche une petite commission,
        sans coût supplémentaire pour toi. Ces commissions m&rsquo;aident à faire
        vivre ce blog et à continuer de partager mes recettes vegan avec toi.
        Merci pour ton soutien&nbsp;! 💚
      </p>
    </aside>
  );
}
