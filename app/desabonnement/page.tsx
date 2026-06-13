// ─────────────────────────────────────────────────────────────────────────────
// /desabonnement?email=...
//
// Page de désabonnement conviviale (voix Chloé).
// Accessible directement ou depuis le lien de désabonnement du footer de mail.
// Listmonk gère le lien de confirmation dans l'email — ce formulaire sert de
// page de confirmation visuelle après le clic one-click.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/newsletter/UnsubscribeForm";

export const metadata: Metadata = {
  title: "Désabonnement newsletter",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function DesabonnementPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email.trim() : "";

  return (
    <div className="vgh-container" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "560px" }}>
      <h1 style={{ fontFamily: "var(--font-vg-title)", fontSize: "1.75rem", marginBottom: "1rem", color: "var(--color-encre)" }}>
        Te désabonner de la newsletter
      </h1>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>
        Tu ne recevras plus les recettes et conseils Vegourmet. Pas de panique — tu
        peux te réinscrire à tout moment depuis la page d&apos;accueil.
      </p>
      <UnsubscribeForm initialEmail={email} />
    </div>
  );
}
