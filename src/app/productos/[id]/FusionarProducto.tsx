"use client";

// Fusionar otros productos DENTRO de éste (RF-07, AC-12). El producto de esta
// página es el destino (su nombre y su historial se conservan); los elegidos se
// absorben y desaparecen. El usuario confirma siempre antes de ejecutar.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Producto {
  id: number;
  nombre: string;
}

export default function FusionarProducto({ destino, otros }: { destino: Producto; otros: Producto[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function toggle(id: number) {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function fusionar() {
    setError(null);
    setGuardando(true);
    try {
      const res = await fetch("/api/productos/fusionar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinoId: destino.id, origenIds: seleccionados }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo fusionar");
        setGuardando(false);
        return;
      }
      setAbierto(false);
      setSeleccionados([]);
      setGuardando(false);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
      setGuardando(false);
    }
  }

  if (otros.length === 0) return null;

  if (!abierto) {
    return (
      <button className="btn btn-secundario btn-chico" onClick={() => setAbierto(true)}>
        Fusionar con otro
      </button>
    );
  }

  return (
    <div className="fusionar tarjeta">
      <p style={{ marginTop: 0 }}>
        Elegí los productos que son <strong>el mismo</strong> que “{destino.nombre}”. Se van a unir
        acá (conservando este nombre y su historial) y los otros se eliminan.
      </p>
      <ul className="lista-check">
        {otros.map((p) => (
          <li key={p.id}>
            <label>
              <input
                type="checkbox"
                checked={seleccionados.includes(p.id)}
                onChange={() => toggle(p.id)}
              />
              <span>{p.nombre}</span>
            </label>
          </li>
        ))}
      </ul>
      {error && <p className="error">{error}</p>}
      <div className="acciones">
        <button className="btn btn-chico" onClick={fusionar} disabled={guardando || seleccionados.length === 0}>
          {guardando ? "Fusionando…" : `Fusionar ${seleccionados.length || ""}`.trim()}
        </button>
        <button
          className="btn btn-secundario btn-chico"
          onClick={() => {
            setAbierto(false);
            setSeleccionados([]);
            setError(null);
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
