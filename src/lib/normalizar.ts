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
 * Similitud [0..1] entre dos nombres, por coeficiente de Jaccard sobre los
 * tokens normalizados. Simple y suficiente para SUGERIR (no para decidir).
 */
export function similitud(a: string, b: string): number {
  const ta = new Set(normalizarNombre(a).split(" ").filter(Boolean));
  const tb = new Set(normalizarNombre(b).split(" ").filter(Boolean));
  if (ta.size === 0 && tb.size === 0) return 1;

  let interseccion = 0;
  for (const t of ta) if (tb.has(t)) interseccion++;
  const union = ta.size + tb.size - interseccion;
  return union === 0 ? 0 : interseccion / union;
}
