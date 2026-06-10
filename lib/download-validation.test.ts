// Tests unitaires de validation pure du système LeadMagnet (route download).
// Node natif (type-stripping) + node:test. Règle no-mocks : aucune requête
// réseau — uniquement la validation du token et l'allowlist de redirection.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allowedRedirectHost,
  isValidToken,
} from "./ressource-validation.ts";

test("download: token non-UUID -> invalide", () => {
  assert.equal(isValidToken("not-a-uuid"), false);
  assert.equal(isValidToken("12345"), false);
  assert.equal(isValidToken(""), false);
  assert.equal(isValidToken(null), false);
  assert.equal(isValidToken(undefined), false);
});

test("download: UUID bien formé -> valide", () => {
  assert.equal(isValidToken("3f9b2c1a-7d4e-4a8b-9c2d-1e2f3a4b5c6d"), true);
  // Insensible à la casse.
  assert.equal(isValidToken("3F9B2C1A-7D4E-4A8B-9C2D-1E2F3A4B5C6D"), true);
});

test("download: host hors allowlist -> bloqué (null)", () => {
  assert.equal(
    allowedRedirectHost("https://phishing-evil.example.com/file.pdf"),
    null,
  );
  assert.equal(
    allowedRedirectHost("https://moncoachgourmand.com/pdf/x.pdf"),
    null,
  );
});

test("download: host Vegourmet allowlisté -> accepté", () => {
  assert.equal(
    allowedRedirectHost("https://static.vegourmet.fr/pdf/guide.pdf"),
    "static.vegourmet.fr",
  );
  assert.equal(
    allowedRedirectHost("https://vegourmet.fr/pdf/guide.pdf"),
    "vegourmet.fr",
  );
  assert.equal(
    allowedRedirectHost("https://www.vegourmet.fr/pdf/guide.pdf"),
    "www.vegourmet.fr",
  );
});

test("download: URL malformée -> null", () => {
  assert.equal(allowedRedirectHost("pas une url"), null);
});
