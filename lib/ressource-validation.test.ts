// Tests unitaires de validation pure du système LeadMagnet (route ressource).
// Exécutés via Node natif (type-stripping) + node:test, sans dépendance externe.
// Règle no-mocks : aucune simulation du webhook n8n — on ne teste que la
// validation des entrées (fonctions pures).

import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRessourceRequest } from "./ressource-validation.ts";

test("ressource: email invalide -> rejet (email_invalid)", () => {
  const r = validateRessourceRequest({
    email: "pas-un-email",
    ressource_slug: "guide-achat-margarine",
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "email_invalid");
});

test("ressource: email vide -> rejet (email_invalid)", () => {
  const r = validateRessourceRequest({
    email: "   ",
    ressource_slug: "guide-achat-margarine",
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "email_invalid");
});

test("ressource: slug manquant -> rejet (slug_invalid)", () => {
  const r = validateRessourceRequest({ email: "chloe@vegourmet.fr" });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "slug_invalid");
});

test("ressource: slug avec caractères interdits -> rejet (slug_invalid)", () => {
  const r = validateRessourceRequest({
    email: "chloe@vegourmet.fr",
    ressource_slug: "Guide Achat!",
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "slug_invalid");
});

test("ressource: body null -> rejet (body_malformed)", () => {
  const r = validateRessourceRequest(null);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "body_malformed");
});

test("ressource: body string -> rejet (body_malformed)", () => {
  const r = validateRessourceRequest("nope");
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "body_malformed");
});

test("ressource: entrée valide -> ok + valeurs trimées", () => {
  const r = validateRessourceRequest({
    email: "  Chloe@Vegourmet.fr ",
    ressource_slug: " guide-achat-margarine ",
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.email, "Chloe@Vegourmet.fr");
    assert.equal(r.value.ressource_slug, "guide-achat-margarine");
  }
});
