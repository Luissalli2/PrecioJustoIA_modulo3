import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

import { registrarCompraManual } from "./registrar-compra.ts";
import { listarSupers } from "../repo/supers.ts";
import { listarProductos } from "../repo/productos.ts";
import { historialDeProducto } from "../repo/compras.ts";

function nuevaBase(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8"));
  return db;
}

test("registrarCompraManual guarda súper nuevo, productos y compra (AC-07, AC-21)", () => {
  const db = nuevaBase();
  const id = registrarCompraManual(db, {
    superNombre: "Coto",
    fecha: "2026-05-01",
    items: [
      { nombre: "Leche entera 1L", precioPorUnidad: 1300 },
      { nombre: "Pan lactal 550g", precioPorUnidad: 1950 },
    ],
  });

  assert.ok(id > 0);
  assert.equal(listarSupers(db).length, 1, "el súper nuevo quedó cargado");
  assert.equal(listarProductos(db).length, 2, "se crearon los 2 productos");
});

test("reutiliza el súper existente y no lo duplica (RF-11)", () => {
  const db = nuevaBase();
  registrarCompraManual(db, { superNombre: "Dia", fecha: "2026-05-01", items: [{ nombre: "Yerba", precioPorUnidad: 3000 }] });
  registrarCompraManual(db, { superNombre: "DIA", fecha: "2026-05-08", items: [{ nombre: "Yerba", precioPorUnidad: 3100 }] });

  assert.equal(listarSupers(db).length, 1, "no duplica el súper por mayúsculas");
  assert.equal(listarProductos(db).length, 1, "reutiliza el producto por nombre exacto");
  // El historial acumula ambas compras del mismo producto.
  const historial = historialDeProducto(db, listarProductos(db)[0].id);
  assert.equal(historial[0].puntos.length, 2);
});

test("rechaza compra sin súper, sin ítems o con precio inválido", () => {
  const db = nuevaBase();
  assert.throws(() => registrarCompraManual(db, { superNombre: "  ", fecha: "2026-05-01", items: [{ nombre: "X", precioPorUnidad: 10 }] }), /súper/);
  assert.throws(() => registrarCompraManual(db, { superNombre: "Coto", fecha: "2026-05-01", items: [] }), /producto/);
  assert.throws(() => registrarCompraManual(db, { superNombre: "Coto", fecha: "2026-05-01", items: [{ nombre: "Leche", precioPorUnidad: 0 }] }), /Precio inválido/);
  // Tras los rechazos, la base quedó intacta (transacción no confirmada).
  assert.equal(listarSupers(db).length, 0);
});
