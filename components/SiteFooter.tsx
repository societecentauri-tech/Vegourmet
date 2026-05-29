import Link from "next/link";

/** Pied de page global. */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-veg-cream-soft bg-veg-cream-soft">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-veg-ink/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-lg font-bold text-veg-terracotta-dark">
              Vegourmet
            </p>
            <p className="text-veg-muted">Recettes vegan faciles &amp; gourmandes</p>
          </div>
          <ul className="flex flex-wrap gap-4">
            <li>
              <Link href="/recettes" className="hover:text-veg-terracotta-dark">
                Recettes
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-veg-terracotta-dark">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/a-propos" className="hover:text-veg-terracotta-dark">
                À propos
              </Link>
            </li>
          </ul>
        </div>
        <p className="mt-6 text-xs text-veg-muted">
          © {new Date().getFullYear()} Vegourmet — POC migration stack Centauri Next.js 16.
        </p>
      </div>
    </footer>
  );
}
