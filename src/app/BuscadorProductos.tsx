"use client";

// Búsqueda de productos por nombre (RF-12, AC-20). Filtra en vivo la lista del
// catálogo (chico, un solo usuario) y linkea al historial de cada producto.

import { useState } from "react";

interface Producto {
  id: number;
  nombre: string;
}

export default function BuscadorProductos({ productos }: { productos: Producto[] }) {
  const [q, setQ] = useState("");

  const termino = q.trim().toLowerCase();
  const filtrados = termino === "" ? productos : productos.filter((p) => p.nombre.toLowerCase().includes(termino));

  return (
    <div>
      <label className="campo">
        <span>Buscar producto</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escribí parte del nombre…"
          autoComplete="off"
        />
      </label>

      {productos.length === 0 ? (
        <div className="tarjeta">
          <p style={{ margin: 0 }}>
            Todavía no hay productos. Registrá una compra o corré <code>npm run seed</code>.
          </p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="tarjeta">
          <p style={{ margin: 0 }}>No hay productos que coincidan con “{q}”.</p>
        </div>
      ) : (
        filtrados.map((p) => (
          <a className="tarjeta tarjeta-link" key={p.id} href={`/productos/${p.id}`}>
            <span>{p.nombre}</span>
            <span className="chevron">›</span>
          </a>
        ))
      )}
    </div>
  );
}
