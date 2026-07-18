// Repositorio de súpers (RF-11). Todas las funciones reciben la conexión como
// primer parámetro para poder testearlas con una base en memoria.

import type { Database } from "better-sqlite3";

export interface Super {
  id: number;
  nombre: string;
}

export function listarSupers(db: Database): Super[] {
  return db.prepare("SELECT id, nombre FROM supers ORDER BY nombre COLLATE NOCASE").all() as Super[];
}

/**
 * Devuelve el súper por nombre; si no existe, lo crea (RF-11). El UNIQUE NOCASE
 * del esquema evita fragmentar el historial por variantes de mayúsculas.
 */
export function obtenerOCrearSuper(db: Database, nombre: string): Super {
  const limpio = nombre.trim();
  if (limpio === "") throw new Error("El nombre del súper no puede estar vacío");

  const existente = db
    .prepare("SELECT id, nombre FROM supers WHERE nombre = ? COLLATE NOCASE")
    .get(limpio) as Super | undefined;
  if (existente) return existente;

  const { lastInsertRowid } = db.prepare("INSERT INTO supers (nombre) VALUES (?)").run(limpio);
  return { id: Number(lastInsertRowid), nombre: limpio };
}
