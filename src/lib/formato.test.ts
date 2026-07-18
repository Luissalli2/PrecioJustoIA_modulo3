import test from "node:test";
import assert from "node:assert/strict";

import { formatearPrecio, formatearFechaISO } from "./formato.ts";

test("formatearFechaISO pasa de ISO a DD/MM/AAAA sin corrimiento de zona", () => {
  assert.equal(formatearFechaISO("2026-06-10"), "10/06/2026");
  assert.equal(formatearFechaISO("2026-01-01"), "01/01/2026");
});

test("formatearPrecio muestra pesos con 2 decimales", () => {
  // El separador puede variar según ICU; validamos las partes clave.
  const s = formatearPrecio(1350);
  assert.ok(s.includes("1.350"), `esperaba miles con punto: ${s}`);
  assert.ok(s.includes(",00"), `esperaba decimales con coma: ${s}`);
});
