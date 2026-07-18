// Repositorio de compras e historial de precios (RF-04, RF-05).

import type { Database } from "better-sqlite3";

export interface ItemCompra {
  productoId: number;
  precioPorUnidad: number;
}

export interface NuevaCompra {
  superId: number;
  fecha: string; // ISO 'YYYY-MM-DD'
  items: ItemCompra[];
}

// Una entrada del historial de un producto (RF-05): precio, fecha y súper.
export interface PuntoHistorial {
  fecha: string;
  precioPorUnidad: number;
  superId: number;
  superNombre: string;
}

// Historial agrupado por súper, cada grupo ordenado cronológicamente (AC-08).
export interface HistorialPorSuper {
  superId: number;
  superNombre: string;
  puntos: { fecha: string; precioPorUnidad: number }[];
}

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Registra una compra con sus ítems en una transacción (RF-04, AC-07). */
export function crearCompra(db: Database, compra: NuevaCompra): number {
  if (!FECHA_ISO.test(compra.fecha)) throw new Error("La fecha debe tener formato YYYY-MM-DD");
  if (compra.items.length === 0) throw new Error("La compra debe tener al menos un ítem");

  const tx = db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare("INSERT INTO compras (super_id, fecha) VALUES (?, ?)")
      .run(compra.superId, compra.fecha);
    const compraId = Number(lastInsertRowid);

    const insertarItem = db.prepare(
      "INSERT INTO items_compra (compra_id, producto_id, precio_por_unidad) VALUES (?, ?, ?)",
    );
    for (const item of compra.items) {
      if (!(item.precioPorUnidad > 0)) throw new Error("El precio por unidad debe ser mayor a 0");
      insertarItem.run(compraId, item.productoId, item.precioPorUnidad);
    }
    return compraId;
  });

  return tx();
}

/**
 * Historial de precios de un producto, separado por súper y ordenado
 * cronológicamente (RF-05, AC-08). Los valores están en pesos nominales; la UI
 * debe aclararlo (no hay ajuste por inflación hasta v2).
 */
export function historialDeProducto(db: Database, productoId: number): HistorialPorSuper[] {
  const filas = db
    .prepare(
      `SELECT c.fecha AS fecha,
              ic.precio_por_unidad AS precioPorUnidad,
              s.id AS superId,
              s.nombre AS superNombre
         FROM items_compra ic
         JOIN compras c ON c.id = ic.compra_id
         JOIN supers  s ON s.id = c.super_id
        WHERE ic.producto_id = ?
        ORDER BY s.nombre COLLATE NOCASE, c.fecha ASC`,
    )
    .all(productoId) as PuntoHistorial[];

  const porSuper = new Map<number, HistorialPorSuper>();
  for (const f of filas) {
    let grupo = porSuper.get(f.superId);
    if (!grupo) {
      grupo = { superId: f.superId, superNombre: f.superNombre, puntos: [] };
      porSuper.set(f.superId, grupo);
    }
    grupo.puntos.push({ fecha: f.fecha, precioPorUnidad: f.precioPorUnidad });
  }
  return [...porSuper.values()];
}
