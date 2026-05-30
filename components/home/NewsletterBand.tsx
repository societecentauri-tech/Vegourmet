/**
 * NewsletterBand — bandeau newsletter (#newsletter_section du thème Yummy Bites).
 * Fond tan/pêche, texte + champs Email/Prénom en ligne + bouton terracotta.
 * Formulaire volontairement non fonctionnel (POC) : `preventDefault` côté client
 * dans la section parente n'est pas requis — le bouton n'est pas de type submit
 * actif vers un backend. On garde un <form> sémantique sans action serveur.
 */
export function NewsletterBand() {
  return (
    <section
      id="newsletter_section"
      className="vgh-newsletter"
      aria-labelledby="vgh-newsletter-title"
    >
      <div className="vgh-container vgh-newsletter-inner">
        <div className="vgh-newsletter-text">
          <h3 id="vgh-newsletter-title">Abonnez-vous à notre newsletter</h3>
          <p>
            Recevez nos dernières recettes, conseils de cuisine et offres
            exclusives directement dans votre boîte de réception.
          </p>
        </div>
        <form className="vgh-newsletter-form" aria-label="Inscription à la newsletter">
          <label className="vgh-sr-only" htmlFor="vgh-nl-email">
            Adresse e-mail
          </label>
          <input
            id="vgh-nl-email"
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="email"
          />
          <label className="vgh-sr-only" htmlFor="vgh-nl-fname">
            Prénom
          </label>
          <input
            id="vgh-nl-fname"
            type="text"
            name="fname"
            placeholder="Prénom"
            autoComplete="given-name"
          />
          <button type="button">S&apos;inscrire</button>
        </form>
      </div>
    </section>
  );
}
