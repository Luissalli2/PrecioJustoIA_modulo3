import test from "node:test";
import assert from "node:assert/strict";

import { parseTicket } from "./ticket-parser.ts";

// Regla de negocio (AC-04): si el MISMO producto aparece en dos líneas del
// ticket (ej. 2 unidades cargadas por separado), el parser lo consolida en
// UN único ítem, conservando el precio POR UNIDAD, sin duplicar la línea.
test("dos líneas del mismo producto se consolidan en un único ítem, con su precio por unidad", () => {
  const texto = [
    "COCA 1.5L   750,00",
    "COCA 1.5L   750,00",
  ].join("\n");

  const items = parseTicket(texto);

  assert.equal(items.length, 1, "esperaba UN solo ítem (no dos líneas)");
  assert.deepEqual(items[0], { producto: "COCA 1.5L", precioPorUnidad: 750 });
});
