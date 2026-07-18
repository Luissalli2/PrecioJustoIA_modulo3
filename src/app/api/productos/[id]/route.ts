// PATCH /api/productos/[id] — renombra un producto conservando su historial
// (RF-08, AC-13). El repo garantiza que no se crea un producto nuevo.
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { renombrarProducto } from "@/lib/repo/productos";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productoId = Number(id);
  if (!Number.isInteger(productoId)) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  let cuerpo: { nombre?: string };
  try {
    cuerpo = (await request.json()) as { nombre?: string };
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  try {
    renombrarProducto(getDb(), productoId, cuerpo.nombre ?? "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "No se pudo renombrar";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
