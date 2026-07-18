// Home (paso 0): lee de la base para demostrar que todo el circuito
// Next.js -> SQLite funciona de punta a punta. Los flujos de carga, historial
// y unificación llegan en los pasos siguientes del plan.

import { getDb } from "@/lib/db";
import { listarSupers } from "@/lib/repo/supers";
import { listarProductos } from "@/lib/repo/productos";

// Esta página lee la base en cada request (datos siempre frescos).
export const dynamic = "force-dynamic";

export default function Home() {
  const db = getDb();
  const supers = listarSupers(db);
  const productos = listarProductos(db);

  return (
    <main>
      <h1>PrecioJusto</h1>
      <p className="subtitulo">Historial de precios de súper a partir de tus tickets.</p>

      <div className="tarjeta">
        <div className="stat">
          <div>
            <span className="n">{productos.length}</span>
            <span className="l">productos</span>
          </div>
          <div>
            <span className="n">{supers.length}</span>
            <span className="l">súpers</span>
          </div>
        </div>
      </div>

      {productos.length === 0 ? (
        <div className="tarjeta">
          <p style={{ margin: 0 }}>
            Todavía no hay datos. Corré <code>npm run seed</code> para cargar ejemplos.
          </p>
        </div>
      ) : (
        productos.map((p) => (
          <div className="tarjeta" key={p.id}>
            {p.nombre}
          </div>
        ))
      )}

      <p className="nota">
        Base generada automáticamente al arrancar. Los precios se muestran en pesos nominales
        (sin ajuste por inflación).
      </p>
    </main>
  );
}
