import Link from "next/link";

const NAV_LINKS = [
  { href: "/recettes", label: "Recettes" },
  { href: "/blog", label: "Blog" },
  { href: "/a-propos", label: "À propos" },
];

/** En-tête global du site avec navigation principale (reprend la nav de vegourmet.fr). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-veg-cream-soft bg-veg-cream/95 backdrop-blur">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
        aria-label="Navigation principale"
      >
        <Link
          href="/"
          className="font-heading text-2xl font-bold text-veg-terracotta-dark hover:text-veg-green"
        >
          Vegourmet
        </Link>
        <ul className="flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-veg-ink hover:text-veg-terracotta-dark"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
