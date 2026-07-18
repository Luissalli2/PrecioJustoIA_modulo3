"use client";

// Formulario de carga manual de una compra (RF-03, RF-04, RF-11). Móvil-primero
// (RF-10). El súper se elige de la lista o se escribe uno nuevo (RF-11, AC-21);
// la fecha viene precargada con hoy (AC-23).
//
// Sugerencia de coincidencias (RF-06): al escribir un producto, el usuario puede
// buscar candidatos del catálogo por similitud y ASOCIAR a uno existente. El
// sistema solo sugiere; nunca asocia solo (AC-09, AC-10, AC-11).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reconocerTicket } from "@/lib/ocr";
import { parseTicket } from "@/lib/ticket-parser";

interface Props {
  supers: { id: number; nombre: string }[];
}

interface Candidato {
  id: number;
  nombre: string;
  score: number;
}

interface Fila {
  nombre: string;
  precio: string; // texto del input; se parsea al enviar
  productoId?: number; // si el usuario asoció a un producto del catálogo (RF-06)
  asociadoNombre?: string;
  candidatos?: Candidato[]; // sugerencias abiertas
  buscando?: boolean;
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

  // Estado del OCR (RF-01): idle → leyendo (con progreso) → ok | error.
  const [ocrEstado, setOcrEstado] = useState<"idle" | "leyendo" | "ok" | "error">("idle");
  const [ocrTexto, setOcrTexto] = useState("");

  async function leerTicket(file: File) {
    setOcrEstado("leyendo");
    setOcrTexto("Preparando…");
    setError(null);
    try {
      const texto = await reconocerTicket(file, (p) => {
        setOcrTexto(p.fase === "leyendo" ? `Leyendo ticket… ${Math.round(p.progreso * 100)}%` : `${p.fase}…`);
      });
      const items = parseTicket(texto);
      if (items.length === 0) {
        // El OCR no encontró líneas de producto legibles (AC-02, AC-06):
        // no inventamos datos; se informa y queda la carga manual disponible.
        setOcrEstado("error");
        return;
      }
      // Pre-carga las filas con lo leído; el usuario corrige antes de confirmar (RF-02).
      setFilas(items.map((it) => ({ nombre: it.producto, precio: String(it.precioPorUnidad) })));
      setOcrEstado("ok");
    } catch {
      setOcrEstado("error");
    }
  }

  function patchFila(i: number, cambios: Partial<Fila>) {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...cambios } : f)));
  }

  function actualizarNombre(i: number, valor: string) {
    // Al cambiar el nombre se descarta cualquier asociación/sugerencia previa.
    patchFila(i, { nombre: valor, productoId: undefined, asociadoNombre: undefined, candidatos: undefined });
  }

  function agregarFila() {
    setFilas((prev) => [...prev, { nombre: "", precio: "" }]);
  }

  function quitarFila(i: number) {
    setFilas((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function buscarCandidatos(i: number) {
    const nombre = filas[i].nombre.trim();
    if (nombre === "") return;
    patchFila(i, { buscando: true });
    try {
      const res = await fetch(`/api/productos/candidatos?nombre=${encodeURIComponent(nombre)}`);
      const data = await res.json();
      patchFila(i, { candidatos: data.candidatos ?? [], buscando: false });
    } catch {
      patchFila(i, { candidatos: [], buscando: false });
    }
  }

  function asociar(i: number, cand: Candidato) {
    patchFila(i, {
      productoId: cand.id,
      asociadoNombre: cand.nombre,
      nombre: cand.nombre,
      candidatos: undefined,
    });
  }

  function desasociar(i: number) {
    patchFila(i, { productoId: undefined, asociadoNombre: undefined });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const items = filas
      .filter((f) => f.nombre.trim() !== "")
      .map((f) => ({
        nombre: f.nombre.trim(),
        precioPorUnidad: Number(f.precio.replace(",", ".")),
        productoId: f.productoId,
      }));

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
      <div className="ocr tarjeta">
        <label className="campo" style={{ marginBottom: 0 }}>
          <span>Foto del ticket (opcional)</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={ocrEstado === "leyendo"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) leerTicket(f);
            }}
          />
        </label>
        {ocrEstado === "leyendo" && <p className="hint">{ocrTexto}</p>}
        {ocrEstado === "ok" && <p className="hint">✅ Ticket leído. Revisá y corregí abajo antes de guardar.</p>}
        {ocrEstado === "error" && (
          <p className="hint">
            No pudimos leer el ticket. Probá con una foto más nítida o cargá los productos a mano.
          </p>
        )}
      </div>

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
          <div className="fila-bloque" key={i}>
            <div className="fila-item">
              <input
                className="fila-nombre"
                value={fila.nombre}
                onChange={(e) => actualizarNombre(i, e.target.value)}
                placeholder="Producto"
              />
              <input
                className="fila-precio"
                value={fila.precio}
                onChange={(e) => patchFila(i, { precio: e.target.value })}
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

            {fila.asociadoNombre ? (
              <div className="asociado">
                <span>↔ Se guarda en “{fila.asociadoNombre}” (del catálogo)</span>
                <button type="button" className="link" onClick={() => desasociar(i)}>
                  deshacer
                </button>
              </div>
            ) : (
              <div className="fila-sugerencias">
                <button
                  type="button"
                  className="link"
                  onClick={() => buscarCandidatos(i)}
                  disabled={fila.nombre.trim() === "" || fila.buscando}
                >
                  {fila.buscando ? "Buscando…" : "¿Ya está en el catálogo?"}
                </button>

                {fila.candidatos && fila.candidatos.length > 0 && (
                  <ul className="candidatos">
                    {fila.candidatos.map((c) => (
                      <li key={c.id}>
                        <span>{c.nombre}</span>
                        <button type="button" className="btn btn-secundario btn-chico" onClick={() => asociar(i, c)}>
                          Usar este
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {fila.candidatos && fila.candidatos.length === 0 && (
                  <p className="hint">Sin coincidencias: se guardará como producto nuevo.</p>
                )}
              </div>
            )}
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
