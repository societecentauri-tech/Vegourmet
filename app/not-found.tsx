import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="font-heading text-4xl font-bold text-veg-terracotta-dark">
        Page introuvable
      </h1>
      <p className="text-veg-ink/75">
        Cette page n'existe pas ou a été déplacée. Retourne à l'accueil pour
        retrouver toutes nos recettes vegan.
      </p>
      <Link
        href="/"
        className="rounded-full bg-veg-green px-6 py-2.5 font-medium text-white transition hover:bg-veg-green-bright"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
