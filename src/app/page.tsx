// Home: resumen del catálogo con búsqueda por nombre (RF-12). Cada producto
// linkea a su historial de precios (RF-05). Lee la base en cada request.

import { getDb } from "@/lib/db";
import { listarSupers } from "@/lib/repo/supers";
import { listarProductos } from "@/lib/repo/productos";
import BuscadorProductos from "./BuscadorProductos";

export const dynamic = "force-dynamic";

export default function Home() {
  const db = getDb();
  const supers = listarSupers(db);
  const productos = listarProductos(db);

  return (
    <main>
      <h1>PrecioJusto</h1>
      <p className="subtitulo">Historial de precios de súper a partir de tus tickets.</p>

      <div className="acciones">
        <a className="btn" href="/compras/nueva">
          + Registrar compra
        </a>
      </div>

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

      <BuscadorProductos productos={productos} />

      <p className="nota">
        Los precios se muestran en pesos nominales (sin ajuste por inflación).
      </p>
    </main>
  );
}
