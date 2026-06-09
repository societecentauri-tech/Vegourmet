/**
 * Tests unitaires de normalizeTags — fonction pure, aucun accès FS ni réseau.
 *
 * NOTE : Le repo Vegourmet n'a pas Vitest (ni Jest) configuré au 2026-06-09.
 * Ce fichier est placé ici pour être prêt à tourner dès l'ajout de Vitest.
 * Commande prévue : `npx vitest run lib/__tests__/normalizeTags.test.ts`
 * (ou équivalent selon la configuration choisie).
 */

import { describe, it, expect } from "vitest";
import { normalizeTags } from "../content";

describe("normalizeTags", () => {
  // --- cas array ---

  it("retourne un tableau propre depuis un array YAML correct", () => {
    expect(normalizeTags(["vegan", "sans-gluten", "rapide"])).toEqual([
      "vegan",
      "sans-gluten",
      "rapide",
    ]);
  });

  it("trimme les espaces dans les éléments d'un array", () => {
    expect(normalizeTags(["  vegan  ", " sans-gluten", "rapide "])).toEqual([
      "vegan",
      "sans-gluten",
      "rapide",
    ]);
  });

  it("filtre les éléments vides/vides après trim dans un array", () => {
    expect(normalizeTags(["vegan", "", "  ", "rapide"])).toEqual([
      "vegan",
      "rapide",
    ]);
  });

  it("convertit les éléments non-string d'un array en strings", () => {
    expect(normalizeTags([42, true, "vegan"])).toEqual(["42", "true", "vegan"]);
  });

  // --- cas string CSV (variance LLM n8n) ---

  it("découpe une string CSV sans espaces", () => {
    expect(normalizeTags("vegan,sans-gluten,rapide")).toEqual([
      "vegan",
      "sans-gluten",
      "rapide",
    ]);
  });

  it("découpe une string CSV avec espaces après les virgules", () => {
    expect(normalizeTags("vegan, sans-gluten, rapide")).toEqual([
      "vegan",
      "sans-gluten",
      "rapide",
    ]);
  });

  it("retourne un tableau à un élément pour une string sans virgule", () => {
    expect(normalizeTags("vegan")).toEqual(["vegan"]);
  });

  it("retourne un tableau vide pour une string vide", () => {
    expect(normalizeTags("")).toEqual([]);
  });

  it("filtre les segments vides dans une string CSV (ex: virgule finale)", () => {
    expect(normalizeTags("vegan,,rapide,")).toEqual(["vegan", "rapide"]);
  });

  // --- cas dégénérés (undefined, null, objet, nombre) ---

  it("retourne [] pour undefined", () => {
    expect(normalizeTags(undefined)).toEqual([]);
  });

  it("retourne [] pour null", () => {
    expect(normalizeTags(null)).toEqual([]);
  });

  it("retourne [] pour un objet", () => {
    expect(normalizeTags({ tag: "vegan" })).toEqual([]);
  });

  it("retourne [] pour un nombre", () => {
    expect(normalizeTags(42)).toEqual([]);
  });

  it("retourne [] pour un booléen", () => {
    expect(normalizeTags(true)).toEqual([]);
  });
});
