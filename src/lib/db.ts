// Conexión única a SQLite con inicialización automática del esquema.
//
// Decisión del proyecto: la base NO se versiona (va al .gitignore). Cuando el
// profesor clona y levanta la app, este módulo crea el archivo .db y aplica
// db/schema.sql en el primer acceso. Sin pasos manuales.

import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = process.env.PRECIOJUSTO_DB ?? join(process.cwd(), "preciojusto.db");
const SCHEMA_PATH = join(process.cwd(), "db", "schema.sql");

let instancia: Database.Database | null = null;

/** Devuelve la conexión (singleton), creando la base y el esquema si hace falta. */
export function getDb(): Database.Database {
  if (instancia) return instancia;

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Auto-init: el esquema usa "IF NOT EXISTS", así que es seguro correrlo siempre.
  db.exec(readFileSync(SCHEMA_PATH, "utf8"));

  instancia = db;
  return db;
}
