// Repositorio del catálogo de productos (RF-06, RF-07, RF-08, RF-12).
// Regla de oro (AGENTS.md): el sistema SUGIERE candidatos por similitud, pero
// NUNCA asocia, fusiona ni renombra solo. Esas acciones las dispara el usuario.

import type { Database } from "better-sqlite3";
import { similitud } from "../normalizar.ts";

export interface Producto {
  id: number;
  nombre: string;
}

export interface Candidato extends Producto {
  score: number;
}

export function listarProductos(db: Database): Producto[] {
  return db
    .prepare("SELECT id, nombre FROM productos ORDER BY nombre COLLATE NOCASE")
    .all() as Producto[];
}

export function obtenerProducto(db: Database, id: number): Producto | undefined {
  return db.prepare("SELECT id, nombre FROM productos WHERE id = ?").get(id) as Producto | undefined;
}

export function crearProducto(db: Database, nombre: string): Producto {
  const limpio = nombre.trim();
  if (limpio === "") throw new Error("El nombre del producto no puede estar vacío");
  const { lastInsertRowid } = db.prepare("INSERT INTO productos (nombre) VALUES (?)").run(limpio);
  return { id: Number(lastInsertRowid), nombre: limpio };
}

/**
 * Devuelve un producto por coincidencia EXACTA de nombre (case-insensitive); si
 * no existe, lo crea. Se usa en la carga manual para no duplicar un producto que
 * ya está escrito igual. No es matching fuzzy (eso es RF-06, con confirmación del
 * usuario): acá el nombre es idéntico, así que no hay asociación que confirmar.
 */
export function obtenerOCrearProducto(db: Database, nombre: string): Producto {
  const limpio = nombre.trim();
  if (limpio === "") throw new Error("El nombre del producto no puede estar vacío");
  const existente = db
    .prepare("SELECT id, nombre FROM productos WHERE nombre = ? COLLATE NOCASE LIMIT 1")
    .get(limpio) as Producto | undefined;
  return existente ?? crearProducto(db, limpio);
}

/** Renombra conservando el historial: no crea un producto nuevo (RF-08, AC-13). */
export function renombrarProducto(db: Database, id: number, nombre: string): void {
  const limpio = nombre.trim();
  if (limpio === "") throw new Error("El nombre del producto no puede estar vacío");
  const { changes } = db.prepare("UPDATE productos SET nombre = ? WHERE id = ?").run(limpio, id);
  if (changes === 0) throw new Error(`No existe el producto ${id}`);
}

/** Búsqueda por nombre para abrir el historial (RF-12, AC-20). */
export function buscarPorNombre(db: Database, query: string): Producto[] {
  const q = query.trim();
  if (q === "") return [];
  return db
    .prepare("SELECT id, nombre FROM productos WHERE nombre LIKE ? ORDER BY nombre COLLATE NOCASE")
    .all(`%${q}%`) as Producto[];
}

/**
 * Sugiere productos del catálogo similares a `nombre` (RF-06). Devuelve los que
 * superan el umbral, ordenados por score descendente. SOLO sugiere: la
 * asociación la confirma el usuario (AC-09, AC-10, AC-11).
 */
export function sugerirCandidatos(db: Database, nombre: string, umbral = 0.34): Candidato[] {
  return listarProductos(db)
    .map((p) => ({ ...p, score: similitud(nombre, p.nombre) }))
    .filter((c) => c.score >= umbral)
    .sort((a, b) => b.score - a.score);
}

/**
 * Fusiona varios productos en uno (RF-07, AC-12): reasigna los ítems de los
 * productos origen al destino y borra los origen. El usuario ya confirmó.
 */
export function fusionarProductos(db: Database, idDestino: number, idsOrigen: number[]): void {
  const origenes = idsOrigen.filter((id) => id !== idDestino);
  if (origenes.length === 0) return;
  if (!obtenerProducto(db, idDestino)) throw new Error(`No existe el producto destino ${idDestino}`);

  const tx = db.transaction(() => {
    const reasignar = db.prepare("UPDATE items_compra SET producto_id = ? WHERE producto_id = ?");
    const borrar = db.prepare("DELETE FROM productos WHERE id = ?");
    for (const origen of origenes) {
      reasignar.run(idDestino, origen);
      borrar.run(origen);
    }
  });
  tx();
}
