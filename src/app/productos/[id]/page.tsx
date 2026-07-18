// Historial de precios de un producto (RF-05, AC-08): separado por súper y
// ordenado cronológicamente, con la fecha de cada precio. Los valores están en
// pesos nominales; la UI lo aclara (sin ajuste por inflación hasta v2).

import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { obtenerProducto, listarProductos } from "@/lib/repo/productos";
import { historialDeProducto } from "@/lib/repo/compras";
import { formatearPrecio, formatearFechaISO } from "@/lib/formato";
import RenombrarProducto from "./RenombrarProducto";
import FusionarProducto from "./FusionarProducto";

export const dynamic = "force-dynamic";

export default async function HistorialProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productoId = Number(id);

  const db = getDb();
  const producto = Number.isInteger(productoId) ? obtenerProducto(db, productoId) : undefined;
  if (!producto) notFound();

  const historial = historialDeProducto(db, producto.id);
  const otros = listarProductos(db).filter((p) => p.id !== producto.id);

  return (
    <main>
      <p className="volver">
        <a href="/">‹ Volver</a>
      </p>
      <h1>{producto.nombre}</h1>
      <p className="subtitulo">Historial de precios por súper.</p>

      <div className="acciones">
        <RenombrarProducto id={producto.id} nombre={producto.nombre} />
        <FusionarProducto destino={producto} otros={otros} />
      </div>

      {historial.length === 0 ? (
        <div className="tarjeta">
          <p style={{ margin: 0 }}>Este producto todavía no tiene compras registradas.</p>
        </div>
      ) : (
        historial.map((grupo) => (
          <div className="tarjeta" key={grupo.superId}>
            <h2 className="super-nombre">{grupo.superNombre}</h2>
            <ul className="historial">
              {grupo.puntos.map((punto, i) => (
                <li key={i}>
                  <span className="fecha">{formatearFechaISO(punto.fecha)}</span>
                  <span className="precio">{formatearPrecio(punto.precioPorUnidad)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <p className="nota">
        Precios en pesos nominales, sin ajuste por inflación. Comparar valores de fechas distintas
        puede ser engañoso hasta la normalización por tipo de cambio (v2).
      </p>
    </main>
  );
}
