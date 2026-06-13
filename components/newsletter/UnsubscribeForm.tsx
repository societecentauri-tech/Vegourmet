"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "loading" | "done" | "error";

interface Props {
  initialEmail?: string;
}

/**
 * Formulaire de désabonnement newsletter (voix Chloé).
 * Appelle `POST /api/newsletter/unsubscribe/` — RFC 8058 compatible.
 */
export function UnsubscribeForm({ initialEmail = "" }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter/unsubscribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Une erreur est survenue. Réessaie plus tard.");
        return;
      }

      setStatus("done");
    } catch {
      setStatus("error");
      setError("Impossible de traiter ta demande. Réessaie plus tard.");
    }
  }

  if (status === "done") {
    return (
      <p role="status" style={{ color: "var(--color-vert, #227755)", fontWeight: 600, fontSize: "1.1rem" }}>
        C&apos;est fait ! Tu es bien désabonné·e. On espère te revoir bientôt. 🌿
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Désabonnement newsletter">
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label htmlFor="vgh-unsub-email" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
          Ton adresse e-mail
        </label>
        <input
          id="vgh-unsub-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="exemple@mail.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "0.6rem 0.9rem",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "1rem",
            width: "100%",
          }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            padding: "0.6rem 1.4rem",
            background: "var(--color-terracotta, #d98e73)",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: status === "loading" ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: "1rem",
            alignSelf: "flex-start",
          }}
        >
          {status === "loading" ? "Traitement…" : "Me désabonner"}
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: "#c0392b", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}
    </form>
  );
}
