// Parser de tickets de súper: convierte el texto crudo (OCR) en ítems.
//
// Enfoque (adaptado de la heurística de la v1, que anda bien en tickets reales):
// - Los productos están ANTES del subtotal/total: cortamos ahí (el pie es ruido:
//   efectivo, vuelto, IVA…).
// - El precio de un producto tiene SIEMPRE 2 decimales ("1.234,56"). Exigir eso
//   descarta solo el ruido del encabezado (dirección, CUIT, teléfono, fecha son
//   enteros sin decimales) sin necesidad de listas de palabras.
// - Se saltean las líneas de cantidad ("0,210 x 9900,00") y se quita la alícuota
//   de IVA entre paréntesis ("(21)").
//
// Reglas de negocio propias:
// - AC-04: si el MISMO producto aparece en varias líneas, se consolida en UN
//   único ítem conservando el precio POR UNIDAD (sin duplicar la línea).
// - AC-03: una línea sin un precio con 2 decimales no es un producto.

export interface ItemTicket {
  producto: string;
  precioPorUnidad: number;
}

// Precio: dígitos y separadores de miles, y al final un separador decimal con
// EXACTAMENTE 2 dígitos ("1.234,56", "125,50", "1234.56"). Global: puede haber
// varios en la línea (el importe suele ser el último).
const PRECIO = /\d[\d.,]*[.,]\d{2}(?!\d)/g;

// A partir de esta línea, lo que sigue es el pie del ticket (no son productos).
const CORTE_PIE = /subtotal|total/i;

// Línea de cantidad por peso/unidad: "0,210 x 9900,00". No es un producto.
const LINEA_CANTIDAD = /\d\s*x\s*\d/i;

/**
 * Convierte el texto de un precio a número respetando los decimales. El último
 * separador seguido de 2 dígitos es el decimal; el resto son de miles.
 *   "1.234,56" -> 1234.56   "1234.56" -> 1234.56   "125,50" -> 125.5
 */
function parsearPrecio(texto: string): number {
  const limpio = texto.replace(/[\s$]/g, "");
  const decimal = limpio.match(/[.,](\d{2})$/);
  if (!decimal) return NaN;
  const entero = limpio.slice(0, -3).replace(/[.,]/g, "");
  return Number(`${entero}.${decimal[1]}`);
}

export function parseTicket(texto: string): ItemTicket[] {
  const items: ItemTicket[] = [];
  const indicePorProducto = new Map<string, number>();

  for (const lineaCruda of texto.split("\n")) {
    const linea = lineaCruda.trim();
    if (linea === "") continue;
    if (CORTE_PIE.test(linea)) break; // llegamos al pie: no hay más productos
    if (LINEA_CANTIDAD.test(linea)) continue; // línea de cantidad, no producto

    // Saca la alícuota de IVA entre paréntesis: "(21)", "(10.5)".
    const limpia = linea.replace(/\([^)]*\)/g, " ");

    const precios = limpia.match(PRECIO);
    if (!precios) continue; // sin precio con 2 decimales → no es un producto

    const textoPrecio = precios[precios.length - 1]; // el importe es el último
    const precioPorUnidad = parsearPrecio(textoPrecio);
    if (!(precioPorUnidad > 0)) continue;

    // Nombre: lo que hay antes del precio, sin cantidad al inicio ni basura.
    const corte = limpia.lastIndexOf(textoPrecio);
    let producto = limpia
      .slice(0, corte)
      .replace(/^\d{1,3}\s+(?=\D)/, "") // cantidad al inicio: "2 LECHE" -> "LECHE"
      .replace(/^[^0-9A-Za-zÁÉÍÓÚÑáéíóúñ]+/, "") // símbolos antes del nombre
      .replace(/[\s\-—|.,$]+$/, "") // separadores y "$" sueltos al final
      .replace(/\s+/g, " ")
      .trim();

    if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(producto)) continue; // debe tener letras

    // Consolidar duplicados: si ya vimos este producto, no agregamos otra línea.
    if (indicePorProducto.has(producto)) continue;

    indicePorProducto.set(producto, items.length);
    items.push({ producto, precioPorUnidad });
  }

  return items;
}
