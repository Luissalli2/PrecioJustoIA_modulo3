// Servicio de carga manual de una compra (paso 2 del plan → RF-03, RF-04, RF-11).
// Orquesta súper + productos + compra en una sola transacción, a partir de los
// NOMBRES que escribió el usuario.
//
// Asociación a un producto existente (RF-06): si el ítem trae `productoId`, es
// porque el usuario CONFIRMÓ en la UI que es un producto del catálogo (a partir
// de una sugerencia por similitud). Nunca se asocia solo: sin productoId, se
// reutiliza por nombre exacto o se crea nuevo.

import type { Database } from "better-sqlite3";
import { obtenerOCrearSuper } from "../repo/supers.ts";
import { obtenerOCrearProducto, obtenerProducto } from "../repo/productos.ts";
import { crearCompra } from "../repo/compras.ts";

export interface ItemManual {
  nombre: string;
  precioPorUnidad: number;
  productoId?: number; // presente si el usuario asoció a un producto existente (RF-06)
}

export interface CompraManual {
  superNombre: string;
  fecha: string; // ISO 'YYYY-MM-DD'
  items: ItemManual[];
}

/**
 * Registra una compra cargada a mano y devuelve su id. Valida entrada, crea el
 * súper si es nuevo (RF-11, AC-21) y reutiliza/crea cada producto por nombre.
 * Todo dentro de una transacción: si algo falla, no queda nada a medias.
 */
export function registrarCompraManual(db: Database, entrada: CompraManual): number {
  const superNombre = entrada.superNombre?.trim() ?? "";
  if (superNombre === "") throw new Error("Elegí o ingresá un súper");

  const items = (entrada.items ?? [])
    .map((i) => ({
      nombre: i.nombre?.trim() ?? "",
      precioPorUnidad: i.precioPorUnidad,
      productoId: i.productoId,
    }))
    .filter((i) => i.nombre !== "");
  if (items.length === 0) throw new Error("Agregá al menos un producto");
  for (const it of items) {
    if (!Number.isFinite(it.precioPorUnidad) || it.precioPorUnidad <= 0) {
      throw new Error(`Precio inválido para "${it.nombre}"`);
    }
  }

  const tx = db.transaction(() => {
    const sup = obtenerOCrearSuper(db, superNombre);
    const itemsCompra = items.map((it) => {
      // Con productoId, el usuario ya confirmó la asociación a un producto del
      // catálogo (RF-06); solo verificamos que exista. Sin él, exacto o nuevo.
      let productoId: number;
      if (it.productoId != null && Number.isInteger(it.productoId)) {
        if (!obtenerProducto(db, it.productoId)) {
          throw new Error(`El producto asociado a "${it.nombre}" no existe`);
        }
        productoId = it.productoId;
      } else {
        productoId = obtenerOCrearProducto(db, it.nombre).id;
      }
      return { productoId, precioPorUnidad: it.precioPorUnidad };
    });
    return crearCompra(db, { superId: sup.id, fecha: entrada.fecha, items: itemsCompra });
  });

  return tx();
}
