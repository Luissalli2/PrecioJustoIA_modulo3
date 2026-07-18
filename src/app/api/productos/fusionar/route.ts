// POST /api/productos/fusionar — fusiona uno o más productos "origen" dentro de
// un "destino", uniendo sus historiales sin duplicar (RF-07, AC-12). El usuario
// ya confirmó la fusión desde la UI; acá solo se ejecuta.
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fusionarProductos } from "@/lib/repo/productos";

export async function POST(request: Request) {
  let cuerpo: { destinoId?: number; origenIds?: number[] };
  try {
    cuerpo = (await request.json()) as { destinoId?: number; origenIds?: number[] };
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  const destinoId = Number(cuerpo.destinoId);
  const origenIds = Array.isArray(cuerpo.origenIds) ? cuerpo.origenIds.map(Number) : [];
  if (!Number.isInteger(destinoId)) {
    return NextResponse.json({ error: "Destino inválido" }, { status: 400 });
  }
  if (origenIds.length === 0 || origenIds.some((n) => !Number.isInteger(n))) {
    return NextResponse.json({ error: "Elegí al menos un producto para fusionar" }, { status: 400 });
  }

  try {
    fusionarProductos(getDb(), destinoId, origenIds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "No se pudo fusionar";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
