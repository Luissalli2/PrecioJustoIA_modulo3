// Normalización de nombres de producto para el matching fuzzy (RF-06).
// Objetivo: que "Leche Entera 1L" y "LECHE ENTERA 1 LT" caigan en la misma
// forma canónica, para SUGERIR candidatos. Nunca asocia solo: el usuario
// confirma siempre (regla de oro del AGENTS.md).

// Abreviaturas frecuentes en tickets → forma larga. Se comparan ya en minúscula.
const ABREVIATURAS: Record<string, string> = {
  lt: "l",
  lts: "l",
  litro: "l",
  litros: "l",
  cc: "ml",
  grs: "g",
  gr: "g",
  gramos: "g",
  kilo: "kg",
  kilos: "kg",
  kgs: "kg",
  x: "",
  u: "",
  un: "",
  und: "",
  unid: "",
};

/** Quita acentos: "café" -> "cafe". */
function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Forma canónica de un nombre de producto: minúsculas, sin acentos, sin signos,
 * con abreviaturas expandidas y espacios colapsados. Además separa números
 * pegados a letras ("1l" -> "1 l") para que la unidad se normalice.
 */
export function normalizarNombre(nombre: string): string {
  const base = sinAcentos(nombre.toLowerCase())
    .replace(/(\d)([a-z])/g, "$1 $2") // "1l" -> "1 l"
    .replace(/([a-z])(\d)/g, "$1 $2") // "l1" -> "l 1"
    .replace(/[^a-z0-9\s]/g, " ") // fuera signos
    .split(/\s+/)
    .filter((t) => t !== "");

  const tokens = base
    .map((token) => (token in ABREVIATURAS ? ABREVIATURAS[token] : token))
    .filter((t) => t !== "");

  return tokens.join(" ");
}

/**
 * Similitud [0..1] entre dos nombres. Combina el coeficiente de Jaccard de los
 * tokens con un peso fuerte al PRIMER token (el sustantivo del producto: "leche",
 * "aceite"…), que en góndola es la señal dominante. Así "Leche entera 1L" y
 * "LECHE SUP 1000CC" caen cerca aunque el resto difiera (AC-09), sin confundir
 * "leche" con "yerba". Es para SUGERIR, no para decidir: el usuario confirma.
 */
export function similitud(a: string, b: string): number {
  const ta = normalizarNombre(a).split(" ").filter(Boolean);
  const tb = normalizarNombre(b).split(" ").filter(Boolean);
  if (ta.length === 0 && tb.length === 0) return 1;

  const sa = new Set(ta);
  const sb = new Set(tb);
  let interseccion = 0;
  for (const t of sa) if (sb.has(t)) interseccion++;
  const union = sa.size + sb.size - interseccion;
  const jaccard = union === 0 ? 0 : interseccion / union;

  const mismaCabeza = ta.length > 0 && tb.length > 0 && ta[0] === tb[0] ? 1 : 0;
  return 0.5 * mismaCabeza + 0.5 * jaccard;
}
