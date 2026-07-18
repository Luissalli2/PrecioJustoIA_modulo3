import test from "node:test";
import assert from "node:assert/strict";

import { normalizarNombre, similitud } from "./normalizar.ts";

test("normalizarNombre unifica mayúsculas, acentos, unidades y abreviaturas", () => {
  assert.equal(normalizarNombre("Leche Entera 1L"), "leche entera 1 l");
  assert.equal(normalizarNombre("LECHE ENTERA 1 LT"), "leche entera 1 l");
  assert.equal(normalizarNombre("Café La Virginia 500grs"), "cafe la virginia 500 g");
});

test("similitud es alta entre variantes del mismo producto y baja entre distintos", () => {
  assert.ok(similitud("Leche entera 1L", "LECHE ENTERA 1 LT") >= 0.9);
  assert.ok(similitud("Leche entera 1L", "Yerba Playadito 1kg") < 0.2);
});

test("detecta el caso AC-09: misma cabeza aunque el resto difiera", () => {
  // "Leche entera 1L" vs "LECHE SUP 1000CC": comparten el sustantivo → se sugiere.
  assert.ok(similitud("Leche entera 1L", "LECHE SUP 1000CC") >= 0.34);
  // Cabezas distintas no se confunden.
  assert.ok(similitud("Leche entera 1L", "Aceite girasol 900ml") < 0.34);
});
