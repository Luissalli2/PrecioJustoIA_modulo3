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

test("tolera formatos reales del OCR: $ y formato inglés", () => {
  const texto = [
    "LECHE ENTERA 1L    $1.050,00", // con símbolo pegado
    "COCA COLA 1.5 LT   $ 950,00", // con símbolo y espacio
    "PAN LACTAL 550G    1.800,00", // formato argentino con miles
    "AZUCAR 1KG         2,350.00", // formato inglés
  ].join("\n");

  const precios = Object.fromEntries(parseTicket(texto).map((i) => [i.producto, i.precioPorUnidad]));
  assert.equal(precios["LECHE ENTERA 1L"], 1050);
  assert.equal(precios["COCA COLA 1.5 LT"], 950);
  assert.equal(precios["PAN LACTAL 550G"], 1800);
  assert.equal(precios["AZUCAR 1KG"], 2350);
});

test("excluye TOTAL, IVA y otras líneas que no son productos", () => {
  const texto = [
    "MANTECA 200G   1.500,00",
    "TOTAL          1.500,00",
    "IVA 21%        260,00",
    "EFECTIVO       2.000,00",
  ].join("\n");

  assert.deepEqual(
    parseTicket(texto).map((i) => i.producto),
    ["MANTECA 200G"],
  );
});

test("ignora datos del encabezado (dirección, CUIT, fecha, teléfono, ticket)", () => {
  const texto = [
    "SUPERMERCADO LA ECONOMIA",
    "AV. SAN MARTIN 1234",
    "CUIT 30-12345678-9",
    "TEL 4567-8900",
    "FECHA 10/07/2026  14:35",
    "TICKET 0001-00012345",
    "LECHE ENTERA 1L    1.050,00",
    "PAN LACTAL 550G    1.800,00",
    "TOTAL              2.850,00",
  ].join("\n");

  assert.deepEqual(
    parseTicket(texto).map((i) => i.producto),
    ["LECHE ENTERA 1L", "PAN LACTAL 550G"],
  );
});

test("respeta los decimales del precio (no agrega ceros de más)", () => {
  const texto = [
    "GALLETITAS         125,50", // coma decimal: 125,50 (no 12550)
    "CAFE 250G          1290.00", // punto decimal: 1290 (no 129000)
    "FIDEOS 500G        1.050,00", // miles + decimal: 1050
    "QUESO CREMA        1.234,56", // miles + decimal
  ].join("\n");

  const precios = Object.fromEntries(parseTicket(texto).map((i) => [i.producto, i.precioPorUnidad]));
  assert.equal(precios["GALLETITAS"], 125.5);
  assert.equal(precios["CAFE 250G"], 1290);
  assert.equal(precios["FIDEOS 500G"], 1050);
  assert.equal(precios["QUESO CREMA"], 1234.56);
});

test("saca la cantidad del inicio de la línea (precio por unidad)", () => {
  const items = parseTicket("2 GASEOSA 2L   1.200,00");
  assert.equal(items.length, 1);
  assert.equal(items[0].producto, "GASEOSA 2L");
  assert.equal(items[0].precioPorUnidad, 1200);
});

test("corta en el subtotal: lo de abajo es el pie del ticket, no productos", () => {
  const texto = [
    "GASEOSA 2L     1.200,00",
    "SUBTOTAL       1.200,00",
    "EFECTIVO       2.000,00", // pie: no debe entrar
    "VUELTO           800,00",
  ].join("\n");

  assert.deepEqual(
    parseTicket(texto).map((i) => i.producto),
    ["GASEOSA 2L"],
  );
});

test("saltea la línea de cantidad por peso y saca la alícuota de IVA (21)", () => {
  const texto = [
    "0,210 x 9900,00", // línea de cantidad por peso → se saltea
    "BANANA (21)        2.079,00", // producto; se saca el (21) del IVA
  ].join("\n");

  const items = parseTicket(texto);
  assert.equal(items.length, 1);
  assert.equal(items[0].producto, "BANANA");
  assert.equal(items[0].precioPorUnidad, 2079);
});
