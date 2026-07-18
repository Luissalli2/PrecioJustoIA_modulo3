// Parser de tickets de súper: convierte el texto crudo (OCR) en ítems.
// Regla de negocio AC-04: si el MISMO producto aparece en varias líneas,
// se consolida en UN único ítem conservando el precio POR UNIDAD.

export interface ItemTicket {
  producto: string;
  precioPorUnidad: number;
}

// Una línea de producto termina en un precio tipo "750,00" o "1.234,50"
// (formato argentino: punto de miles, coma decimal).
const LINEA_PRODUCTO = /^(.+?)\s+([\d.]+,\d{2})$/;

function parsearPrecio(texto: string): number {
  // "1.234,50" -> 1234.50
  const normalizado = texto.replace(/\./g, "").replace(",", ".");
  return Number(normalizado);
}

export function parseTicket(texto: string): ItemTicket[] {
  const items: ItemTicket[] = [];
  const indicePorProducto = new Map<string, number>();

  for (const lineaCruda of texto.split("\n")) {
    const linea = lineaCruda.trim();
    if (linea === "") continue;

    const match = LINEA_PRODUCTO.exec(linea);
    if (match === null) continue; // no es una línea de producto

    const producto = match[1].trim();
    const precioPorUnidad = parsearPrecio(match[2]);

    // Consolidar duplicados: si ya vimos este producto, no agregamos otra línea.
    if (indicePorProducto.has(producto)) continue;

    indicePorProducto.set(producto, items.length);
    items.push({ producto, precioPorUnidad });
  }

  return items;
}
