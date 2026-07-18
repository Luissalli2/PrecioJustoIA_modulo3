// Seed de demo (opcional): carga súpers, productos y algunas compras de ejemplo
// para que, al clonar el repo, haya datos que probar sin cargar tickets a mano.
// Uso: `npm run seed`. Es idempotente-ish: si ya hay compras, no vuelve a cargar.

import { getDb } from "../src/lib/db.ts";
import { obtenerOCrearSuper } from "../src/lib/repo/supers.ts";
import { crearProducto } from "../src/lib/repo/productos.ts";
import { crearCompra } from "../src/lib/repo/compras.ts";

const db = getDb();

const yaHayDatos = (db.prepare("SELECT COUNT(*) AS n FROM compras").get() as { n: number }).n > 0;
if (yaHayDatos) {
  console.log("La base ya tiene compras; no se vuelve a sembrar. (Borrá preciojusto.db para reiniciar.)");
  process.exit(0);
}

const coto = obtenerOCrearSuper(db, "Coto");
const dia = obtenerOCrearSuper(db, "Dia");
const carrefour = obtenerOCrearSuper(db, "Carrefour");

const leche = crearProducto(db, "Leche entera 1L");
const yerba = crearProducto(db, "Yerba Playadito 1kg");
const aceite = crearProducto(db, "Aceite girasol 900ml");
const pan = crearProducto(db, "Pan lactal 550g");

crearCompra(db, {
  superId: coto.id,
  fecha: "2026-01-12",
  items: [
    { productoId: leche.id, precioPorUnidad: 1050 },
    { productoId: yerba.id, precioPorUnidad: 3200 },
    { productoId: pan.id, precioPorUnidad: 1800 },
  ],
});

crearCompra(db, {
  superId: dia.id,
  fecha: "2026-02-08",
  items: [
    { productoId: leche.id, precioPorUnidad: 1120 },
    { productoId: aceite.id, precioPorUnidad: 2500 },
  ],
});

crearCompra(db, {
  superId: carrefour.id,
  fecha: "2026-03-03",
  items: [
    { productoId: leche.id, precioPorUnidad: 1200 },
    { productoId: yerba.id, precioPorUnidad: 3450 },
  ],
});

crearCompra(db, {
  superId: coto.id,
  fecha: "2026-04-01",
  items: [
    { productoId: leche.id, precioPorUnidad: 1290 },
    { productoId: pan.id, precioPorUnidad: 1950 },
  ],
});

console.log("Seed cargado: 3 súpers, 4 productos y 4 compras de ejemplo.");
