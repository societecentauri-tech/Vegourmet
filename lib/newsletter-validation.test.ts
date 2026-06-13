// Tests unitaires des fonctions pures de validation newsletter.
// Exécutés via Node natif (type-stripping) + node:test, sans dépendance externe.
// Règle no-mocks (00-global/rules/no-mocks.md) : aucun appel réseau ni Listmonk
// — uniquement la validation des entrées (fonctions pures sans I/O).

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  validateSubscribeInput,
  validateUnsubscribeInput,
} from "./newsletter-validation.ts";

// ── validateSubscribeInput ───────────────────────────────────────────────────

describe("validateSubscribeInput", () => {
  test("email valide + consentement -> ok", () => {
    const r = validateSubscribeInput({
      email: "chloe@vegourmet.fr",
      consentWording: "J'accepte de recevoir la newsletter.",
    });
    assert.equal(r.ok, true);
    if (!r.ok) throw new Error("unreachable");
    assert.equal(r.data.email, "chloe@vegourmet.fr");
    assert.equal(r.data.source, "homepage"); // default
  });

  test("email en majuscules -> normalisé en minuscules", () => {
    const r = validateSubscribeInput({
      email: "CHLOE@VEGOURMET.FR",
      consentWording: "J'accepte la newsletter.",
    });
    assert.equal(r.ok, true);
    if (!r.ok) throw new Error("unreachable");
    assert.equal(r.data.email, "chloe@vegourmet.fr");
  });

  test("email invalide -> rejet email_invalid", () => {
    const r = validateSubscribeInput({
      email: "pas-un-email",
      consentWording: "J'accepte la newsletter.",
    });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "email_invalid");
  });

  test("email vide -> rejet email_invalid", () => {
    const r = validateSubscribeInput({
      email: "   ",
      consentWording: "J'accepte la newsletter.",
    });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "email_invalid");
  });

  test("email trop long (>254) -> rejet email_too_long", () => {
    const r = validateSubscribeInput({
      email: `${"a".repeat(250)}@x.fr`,
      consentWording: "J'accepte la newsletter.",
    });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "email_too_long");
  });

  test("consentement absent -> rejet consent_missing", () => {
    const r = validateSubscribeInput({
      email: "chloe@vegourmet.fr",
      consentWording: "",
    });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "consent_missing");
  });

  test("consentement trop court (<5 car) -> rejet consent_missing", () => {
    const r = validateSubscribeInput({
      email: "chloe@vegourmet.fr",
      consentWording: "ok",
    });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "consent_missing");
  });

  test("prénom trop long (>80 car) -> rejet first_name_too_long", () => {
    const r = validateSubscribeInput({
      email: "chloe@vegourmet.fr",
      consentWording: "J'accepte la newsletter.",
      firstName: "x".repeat(81),
    });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "first_name_too_long");
  });

  test("source trop longue (>80 car) -> rejet source_too_long", () => {
    const r = validateSubscribeInput({
      email: "chloe@vegourmet.fr",
      consentWording: "J'accepte la newsletter.",
      source: "x".repeat(81),
    });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "source_too_long");
  });

  test("firstName et source optionnels -> présents dans data", () => {
    const r = validateSubscribeInput({
      email: "marie@vegourmet.fr",
      firstName: "Marie",
      consentWording: "J'accepte la newsletter.",
      source: "popup-recette",
    });
    assert.equal(r.ok, true);
    if (!r.ok) throw new Error("unreachable");
    assert.equal(r.data.firstName, "Marie");
    assert.equal(r.data.source, "popup-recette");
  });

  test("input null -> rejet email_invalid", () => {
    const r = validateSubscribeInput(null);
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "email_invalid");
  });

  test("input chaîne -> rejet email_invalid", () => {
    const r = validateSubscribeInput("chloe@vegourmet.fr");
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "email_invalid");
  });
});

// ── validateUnsubscribeInput ─────────────────────────────────────────────────

describe("validateUnsubscribeInput", () => {
  test("email valide -> ok avec normalisation", () => {
    const r = validateUnsubscribeInput({ email: "CHLOE@VEGOURMET.FR" });
    assert.equal(r.ok, true);
    if (!r.ok) throw new Error("unreachable");
    assert.equal(r.email, "chloe@vegourmet.fr");
  });

  test("email invalide -> rejet email_invalid", () => {
    const r = validateUnsubscribeInput({ email: "pas-valide" });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "email_invalid");
  });

  test("email trop long -> rejet email_too_long", () => {
    const r = validateUnsubscribeInput({ email: `${"a".repeat(250)}@x.fr` });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "email_too_long");
  });

  test("email manquant -> rejet email_invalid", () => {
    const r = validateUnsubscribeInput({});
    assert.equal(r.ok, false);
  });

  test("input null -> rejet email_invalid", () => {
    const r = validateUnsubscribeInput(null);
    assert.equal(r.ok, false);
  });
});
