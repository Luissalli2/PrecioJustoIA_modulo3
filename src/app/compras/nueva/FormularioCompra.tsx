"use client";

// Formulario de carga manual de una compra (paso 2 → RF-03, RF-04, RF-11).
// Móvil-primero (RF-10). El súper se elige de la lista o se escribe uno nuevo
// (RF-11, AC-21); la fecha viene precargada con hoy (AC-23).

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  supers: { id: number; nombre: string }[];
}

interface Fila {
  nombre: string;
  precio: string; // texto del input; se parsea al enviar
}

function hoyISO(): string {
  // Fecha local en formato YYYY-MM-DD para precargar el input date (AC-23).
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export default function FormularioCompra({ supers }: Props) {
  const router = useRouter();
  const [superNombre, setSuperNombre] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [filas, setFilas] = useState<Fila[]>([{ nombre: "", precio: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  function actualizarFila(i: number, campo: keyof Fila, valor: string) {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)));
  }

  function agregarFila() {
    setFilas((prev) => [...prev, { nombre: "", precio: "" }]);
  }

  function quitarFila(i: number) {
    setFilas((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const items = filas
      .filter((f) => f.nombre.trim() !== "")
      .map((f) => ({ nombre: f.nombre.trim(), precioPorUnidad: Number(f.precio.replace(",", ".")) }));

    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ superNombre, fecha, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la compra");
        setGuardando(false);
        return;
      }
      setOk(true);
      // Refresca los datos del server (home y catálogo) tras guardar.
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
      setGuardando(false);
    }
  }

  if (ok) {
    return (
      <div className="tarjeta">
        <p style={{ marginTop: 0 }}>✅ Compra guardada.</p>
        <div className="acciones">
          <button
            className="btn"
            onClick={() => {
              setOk(false);
              setSuperNombre("");
              setFecha(hoyISO());
              setFilas([{ nombre: "", precio: "" }]);
              setGuardando(false);
            }}
          >
            Cargar otra
          </button>
          <a className="btn btn-secundario" href="/">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={guardar}>
      <label className="campo">
        <span>Súper</span>
        <input
          list="lista-supers"
          value={superNombre}
          onChange={(e) => setSuperNombre(e.target.value)}
          placeholder="Elegí uno o escribí uno nuevo"
          autoComplete="off"
        />
        <datalist id="lista-supers">
          {supers.map((s) => (
            <option key={s.id} value={s.nombre} />
          ))}
        </datalist>
      </label>

      <label className="campo">
        <span>Fecha</span>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </label>

      <fieldset className="items">
        <legend>Productos</legend>
        {filas.map((fila, i) => (
          <div className="fila-item" key={i}>
            <input
              className="fila-nombre"
              value={fila.nombre}
              onChange={(e) => actualizarFila(i, "nombre", e.target.value)}
              placeholder="Producto"
            />
            <input
              className="fila-precio"
              value={fila.precio}
              onChange={(e) => actualizarFila(i, "precio", e.target.value)}
              placeholder="Precio"
              inputMode="decimal"
            />
            <button
              type="button"
              className="btn-quitar"
              onClick={() => quitarFila(i)}
              aria-label="Quitar producto"
              disabled={filas.length === 1}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-secundario" onClick={agregarFila}>
          + Agregar producto
        </button>
      </fieldset>

      {error && <p className="error">{error}</p>}

      <div className="acciones">
        <button type="submit" className="btn" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar compra"}
        </button>
        <a className="btn btn-secundario" href="/">
          Cancelar
        </a>
      </div>
    </form>
  );
}
