import Link from "next/link";

export interface Crumb {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: Crumb[];
}

/** Fil d'Ariane visuel (le JSON-LD BreadcrumbList est émis séparément via JsonLd). */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm text-veg-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              {isLast ? (
                <span aria-current="page" className="text-veg-ink/70">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-veg-terracotta-dark">
                  {item.name}
                </Link>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
