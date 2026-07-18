// POST /api/compras — registra una compra cargada manualmente (paso 2).
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { registrarCompraManual, type CompraManual } from "@/lib/services/registrar-compra";

export async function POST(request: Request) {
  let cuerpo: CompraManual;
  try {
    cuerpo = (await request.json()) as CompraManual;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  try {
    const compraId = registrarCompraManual(getDb(), cuerpo);
    return NextResponse.json({ compraId }, { status: 201 });
  } catch (e) {
    // Errores de validación del servicio → 400 con el mensaje para la UI.
    const mensaje = e instanceof Error ? e.message : "No se pudo guardar la compra";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
