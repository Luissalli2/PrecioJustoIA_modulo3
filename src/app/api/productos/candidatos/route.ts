// GET /api/productos/candidatos?nombre=... — sugiere productos del catálogo
// similares a un nombre (RF-06). SOLO sugiere: la asociación la confirma el
// usuario en la UI (AC-09, AC-10, AC-11). Nunca asocia por su cuenta.
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sugerirCandidatos } from "@/lib/repo/productos";

export async function GET(request: Request) {
  const nombre = new URL(request.url).searchParams.get("nombre")?.trim() ?? "";
  if (nombre === "") return NextResponse.json({ candidatos: [] });

  const candidatos = sugerirCandidatos(getDb(), nombre).slice(0, 5);
  return NextResponse.json({ candidatos });
}
