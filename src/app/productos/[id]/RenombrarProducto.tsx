"use client";

// Renombrar un producto conservando su historial (RF-08, AC-13). El usuario
// dispara la acción; el back garantiza que no se crea un producto nuevo.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RenombrarProducto({ id, nombre }: { id: number; nombre: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nombre);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: valor }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo renombrar");
        setGuardando(false);
        return;
      }
      setEditando(false);
      setGuardando(false);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
      setGuardando(false);
    }
  }

  if (!editando) {
    return (
      <button className="btn btn-secundario btn-chico" onClick={() => setEditando(true)}>
        Renombrar
      </button>
    );
  }

  return (
    <div className="renombrar">
      <input value={valor} onChange={(e) => setValor(e.target.value)} aria-label="Nuevo nombre" />
      {error && <p className="error">{error}</p>}
      <div className="acciones">
        <button className="btn btn-chico" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          className="btn btn-secundario btn-chico"
          onClick={() => {
            setEditando(false);
            setValor(nombre);
            setError(null);
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
