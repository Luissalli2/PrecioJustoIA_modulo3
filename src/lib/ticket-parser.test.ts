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

test("parsea varios productos y descarta líneas sin precio válido (AC-03)", () => {
  const texto = [
    "LECHE ENTERA 1L      1.050,00",
    "2x1 PROMO",              // promo sin precio → no es producto
    "YERBA 1KG            3.200,00",
    "DESC. 10%",             // descuento sin precio con formato → se descarta
    "PAN LACTAL 550G      1.800,00",
    "TOTAL                6.050,00", // el TOTAL igual matchea; lo ajusta el usuario (RF-02)
  ].join("\n");

  const items = parseTicket(texto);
  const nombres = items.map((i) => i.producto);

  assert.ok(nombres.includes("LECHE ENTERA 1L"));
  assert.ok(nombres.includes("YERBA 1KG"));
  assert.ok(nombres.includes("PAN LACTAL 550G"));
  assert.ok(!nombres.includes("2x1 PROMO"), "una promo sin precio no es un producto");
  assert.ok(!nombres.includes("DESC. 10%"), "un descuento sin precio válido no es un producto");
});
