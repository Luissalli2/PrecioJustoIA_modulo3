import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

import { obtenerOCrearSuper, listarSupers } from "./supers.ts";
import {
  crearProducto,
  renombrarProducto,
  buscarPorNombre,
  sugerirCandidatos,
  fusionarProductos,
  listarProductos,
} from "./productos.ts";
import { crearCompra, historialDeProducto } from "./compras.ts";

function nuevaBase(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8"));
  return db;
}

test("obtenerOCrearSuper no duplica por variantes de mayúsculas (RF-11)", () => {
  const db = nuevaBase();
  const a = obtenerOCrearSuper(db, "Coto");
  const b = obtenerOCrearSuper(db, "COTO");
  assert.equal(a.id, b.id);
  assert.equal(listarSupers(db).length, 1);
});

test("crearCompra guarda la compra con su precio por unidad y arma el historial (RF-04, RF-05)", () => {
  const db = nuevaBase();
  const coto = obtenerOCrearSuper(db, "Coto");
  const dia = obtenerOCrearSuper(db, "Dia");
  const leche = crearProducto(db, "Leche entera 1L");

  crearCompra(db, { superId: coto.id, fecha: "2026-01-10", items: [{ productoId: leche.id, precioPorUnidad: 1000 }] });
  crearCompra(db, { superId: dia.id, fecha: "2026-02-15", items: [{ productoId: leche.id, precioPorUnidad: 1100 }] });
  crearCompra(db, { superId: coto.id, fecha: "2026-03-01", items: [{ productoId: leche.id, precioPorUnidad: 1200 }] });

  const historial = historialDeProducto(db, leche.id);
  assert.equal(historial.length, 2, "esperaba 2 grupos (Coto y Dia)");

  const grupoCoto = historial.find((g) => g.superNombre === "Coto")!;
  assert.deepEqual(
    grupoCoto.puntos.map((p) => p.precioPorUnidad),
    [1000, 1200],
    "Coto debe estar ordenado cronológicamente",
  );
});

test("sugerirCandidatos detecta similitud pero NO asocia (RF-06, AC-09)", () => {
  const db = nuevaBase();
  crearProducto(db, "Leche entera 1L");
  const candidatos = sugerirCandidatos(db, "LECHE ENTERA 1 LT");
  assert.ok(candidatos.length >= 1, "esperaba al menos un candidato");
  assert.equal(candidatos[0].nombre, "Leche entera 1L");
  // El catálogo NO cambió: sugerir no crea ni asocia nada.
  assert.equal(listarProductos(db).length, 1);
});

test("renombrarProducto conserva el historial (RF-08, AC-13)", () => {
  const db = nuevaBase();
  const coto = obtenerOCrearSuper(db, "Coto");
  const p = crearProducto(db, "Leche");
  crearCompra(db, { superId: coto.id, fecha: "2026-01-10", items: [{ productoId: p.id, precioPorUnidad: 900 }] });

  renombrarProducto(db, p.id, "Leche entera 1L");

  assert.equal(listarProductos(db).length, 1, "no debe crear un producto nuevo");
  assert.equal(listarProductos(db)[0].nombre, "Leche entera 1L");
  assert.equal(historialDeProducto(db, p.id)[0].puntos.length, 1, "conserva el historial");
});

test("fusionarProductos une historiales sin duplicar (RF-07, AC-12)", () => {
  const db = nuevaBase();
  const coto = obtenerOCrearSuper(db, "Coto");
  const a = crearProducto(db, "Leche entera 1L");
  const b = crearProducto(db, "Leche SL 1000cc");
  crearCompra(db, { superId: coto.id, fecha: "2026-01-10", items: [{ productoId: a.id, precioPorUnidad: 1000 }] });
  crearCompra(db, { superId: coto.id, fecha: "2026-02-10", items: [{ productoId: b.id, precioPorUnidad: 1100 }] });

  fusionarProductos(db, a.id, [b.id]);

  assert.equal(listarProductos(db).length, 1, "queda un único producto");
  const historial = historialDeProducto(db, a.id);
  assert.equal(historial[0].puntos.length, 2, "el historial combinado tiene ambos precios");
});

test("buscarPorNombre encuentra por coincidencia parcial (RF-12, AC-20)", () => {
  const db = nuevaBase();
  crearProducto(db, "Leche entera 1L");
  crearProducto(db, "Yerba 1kg");
  const r = buscarPorNombre(db, "lech");
  assert.equal(r.length, 1);
  assert.equal(r[0].nombre, "Leche entera 1L");
});
