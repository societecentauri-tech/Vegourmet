// ─────────────────────────────────────────────────────────────────────────────
// Validation + sanitization d'un nouvel avis (route POST /api/comments).
//
// Choix : validation manuelle (zéro dépendance) plutôt que Zod, pour garder le
// build SSG auto-suffisant sans ajout de paquet à coordonner. Le contrat est
// strict (types, bornes, longueurs) et le schéma est explicite ci-dessous ;
// migration possible vers Zod si `zod` est ajouté au projet (cf. DETTE.md).
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidatedComment {
  slug: string;
  authorName: string;
  content: string;
  rating: number;
}

export type ValidationResult =
  | { ok: true; value: ValidatedComment }
  | { ok: false; error: string };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME = 80;
const MIN_CONTENT = 3;
const MAX_CONTENT = 4000;

/**
 * Retire les balises HTML et neutralise les caractères de contrôle.
 * Le rendu se fait en texte brut (React échappe déjà), mais on assainit en
 * amont pour ne jamais stocker de markup ni de bruit invisible. Les retours à
 * la ligne (\n) sont conservés ; les autres caractères de contrôle sont retirés.
 */
export function sanitizeText(input: string): string {
  // Caractères de contrôle ASCII à retirer (on PRÉSERVE \n et \t) :
  // U+0000–U+0008, U+000B, U+000C, U+000E–U+001F, U+007F.
  const controlChars =
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
  return input
    .replace(/<[^>]*>/g, " ") // supprime tout markup HTML
    .replace(controlChars, "") // ctrl chars (garde \n et \t)
    .replace(/[^\S\n]{2,}/g, " ") // espaces/tabs multiples -> 1 espace (préserve les sauts de ligne)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Valide le corps JSON d'un POST d'avis. Retourne une valeur sûre ou une erreur. */
export function validateNewComment(body: unknown): ValidationResult {
  if (!isObject(body)) {
    return { ok: false, error: "Corps de requête invalide." };
  }

  const slugRaw = body.slug;
  if (typeof slugRaw !== "string" || !SLUG_RE.test(slugRaw)) {
    return { ok: false, error: "Slug de recette invalide." };
  }

  const nameRaw = body.authorName ?? body.name;
  if (typeof nameRaw !== "string") {
    return { ok: false, error: "Le nom est requis." };
  }
  const authorName = sanitizeText(nameRaw);
  if (authorName.length < 2 || authorName.length > MAX_NAME) {
    return {
      ok: false,
      error: `Le nom doit faire entre 2 et ${MAX_NAME} caractères.`,
    };
  }

  const contentRaw = body.content;
  if (typeof contentRaw !== "string") {
    return { ok: false, error: "Le commentaire est requis." };
  }
  const content = sanitizeText(contentRaw);
  if (content.length < MIN_CONTENT) {
    return { ok: false, error: "Le commentaire est trop court." };
  }
  if (content.length > MAX_CONTENT) {
    return {
      ok: false,
      error: `Le commentaire dépasse ${MAX_CONTENT} caractères.`,
    };
  }

  const ratingRaw = body.rating;
  const rating =
    typeof ratingRaw === "number"
      ? ratingRaw
      : typeof ratingRaw === "string"
        ? Number.parseInt(ratingRaw, 10)
        : Number.NaN;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "La note doit être comprise entre 1 et 5." };
  }

  return {
    ok: true,
    value: { slug: slugRaw, authorName, content, rating },
  };
}
