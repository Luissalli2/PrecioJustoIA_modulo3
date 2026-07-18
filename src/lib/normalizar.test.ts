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
