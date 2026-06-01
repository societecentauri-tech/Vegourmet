"use client";

import { useEffect, useRef, useState } from "react";

/** Recherche header : la loupe ouvre un champ ; soumission GET vers /recettes?s= */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={`header-search${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="search-toggle"
        aria-label={open ? "Fermer la recherche" : "Rechercher"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          width="21"
          height="20"
          viewBox="0 0 21 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M9.83325 16.6667C13.9754 16.6667 17.3333 13.3089 17.3333 9.16675C17.3333 5.02461 13.9754 1.66675 9.83325 1.66675C5.69112 1.66675 2.33325 5.02461 2.33325 9.16675C2.33325 13.3089 5.69112 16.6667 9.83325 16.6667Z"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.1665 17.5L15.6665 15"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <form className="header-search-form" role="search" action="/recettes" method="get">
        <input
          ref={inputRef}
          type="search"
          name="s"
          placeholder="Rechercher une recette…"
          aria-label="Rechercher une recette"
        />
      </form>
    </div>
  );
}
