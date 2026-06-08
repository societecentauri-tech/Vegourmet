/**
 * RecipeIcons — jeu d'icônes inline (SVG) pour la recipe card vegourmet.fr.
 * Reproduit les pictogrammes du plugin WP Delicious (temps, portions, etc.).
 * Tous décoratifs : aria-hidden, dimensionnés via CSS.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm.75-13h-1.5v5.31l4.28 2.57.77-1.29-3.55-2.1V7Z" />
    </svg>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9.4L5 20.5a1 1 0 0 1-1.6-.8V17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v10h2v2.6L8.7 15H20V5H4Z" />
    </svg>
  );
}

export function FireIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12.5 1.5s1.2 2.3.6 4.2c-.6 1.9-2.6 2.7-2.6 5 0 1 .5 1.8 1.2 2.3-.1-1.3.6-2.2 1.4-2.7-.2 1.6.8 2.3.8 3.7a2.4 2.4 0 0 1-2.6 2.4c1.4 1 4.7.8 6.1-1.6 1-1.7.7-3.9-.4-5.7-1-1.6-1-2.4-.7-3.7-1.3.6-2 1.8-2 3.2-.9-1.2-1-2.8-.5-4 .6-1.5-.1-3-1.3-3.4Z" />
    </svg>
  );
}

export function TimerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 1H9v2h6V1Zm-4 13h2V8h-2v6Zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.96 8.96 0 0 0 12 4a9 9 0 1 0 9 9 8.96 8.96 0 0 0-1.97-5.61ZM12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
    </svg>
  );
}

export function ServingsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7Zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4Z" />
    </svg>
  );
}

export function DifficultyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 13h4v8H3v-8Zm7-6h4v14h-4V7Zm7-4h4v18h-4V3Z" />
    </svg>
  );
}

export function AuthorIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z" />
    </svg>
  );
}

export function CuisineIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8ZM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96ZM4.26 14a7.96 7.96 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26Zm.81 2h2.95c.34 1.27.81 2.47 1.38 3.56A8.03 8.03 0 0 1 5.07 16Zm2.95-8H5.07a8.03 8.03 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.02 8ZM12 19.96A14.4 14.4 0 0 1 10.09 16h3.82A14.4 14.4 0 0 1 12 19.96ZM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4Zm.25 5.56c.57-1.09 1.04-2.29 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56ZM16.36 14a16.5 16.5 0 0 0 0-4h3.38a7.96 7.96 0 0 1 0 4h-3.38Z" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21.41 11.58 12.41 2.58A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9a2 2 0 0 0 2.82 0l7-7a2 2 0 0 0 0-2.84ZM6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8Z" />
    </svg>
  );
}

export function PrintIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-3 11H8v-5h8v5Zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-1-9H6v4h12V3Z" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M17 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5V9h12v10Zm0-12H5V5h12v2Z" />
    </svg>
  );
}

export function GoToIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="M12 4 10.6 5.4l5.6 5.6H4v2h12.2l-5.6 5.6L12 20l8-8-8-8Z" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="m12 17.27 5.18 3.12-1.37-5.9 4.58-3.96-6.03-.52L12 4.5l-2.36 5.51-6.03.52 4.58 3.96-1.37 5.9L12 17.27Z" />
    </svg>
  );
}
