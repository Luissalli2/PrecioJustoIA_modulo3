-- Esquema de PrecioJusto (MVP v1). Se aplica automáticamente al arrancar la app
-- si la base no existe todavía (ver src/lib/db.ts). Todo con "IF NOT EXISTS"
-- para ser idempotente: correrlo muchas veces no rompe nada.

-- Súpers cargados por el usuario (RF-11). El nombre es único para no fragmentar
-- el historial por variantes del mismo súper.
CREATE TABLE IF NOT EXISTS supers (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  UNIQUE (nombre COLLATE NOCASE)
);

-- Catálogo de productos (RF-06/07/08). Un producto agrupa el historial de
-- precios entre súpers. La unificación la confirma siempre el usuario.
CREATE TABLE IF NOT EXISTS productos (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL
);

-- Una compra = un ticket confirmado, con su fecha y su súper (RF-04).
CREATE TABLE IF NOT EXISTS compras (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  super_id INTEGER NOT NULL REFERENCES supers(id),
  fecha    TEXT NOT NULL  -- ISO 'YYYY-MM-DD'
);

-- Cada línea de una compra: qué producto y a qué precio POR UNIDAD (RF-04).
CREATE TABLE IF NOT EXISTS items_compra (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  compra_id         INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  producto_id       INTEGER NOT NULL REFERENCES productos(id),
  precio_por_unidad REAL NOT NULL
);

-- Índices para las consultas de historial (RF-05) y búsqueda (RF-12).
CREATE INDEX IF NOT EXISTS idx_items_producto ON items_compra (producto_id);
CREATE INDEX IF NOT EXISTS idx_items_compra   ON items_compra (compra_id);
CREATE INDEX IF NOT EXISTS idx_compras_super  ON compras (super_id);
