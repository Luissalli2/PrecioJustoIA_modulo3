// OCR de tickets con Tesseract (tesseract.js), 100% en el navegador: local, sin
// API key (RF-01). La primera vez descarga el modelo de idioma y el wasm desde
// el CDN, así que requiere conexión; después queda cacheado.
//
// Devuelve el texto crudo; el parseo a ítems lo hace ticket-parser.ts (testeado).

export interface ProgresoOCR {
  fase: string; // "cargando modelo" | "leyendo" | …
  progreso: number; // 0..1
}

/** Reconoce el texto de una imagen de ticket (idioma español). */
export async function reconocerTicket(
  file: File,
  onProgress?: (p: ProgresoOCR) => void,
): Promise<string> {
  // Import dinámico: tesseract.js solo se carga cuando el usuario sube una foto.
  const Tesseract = (await import("tesseract.js")).default;

  const { data } = await Tesseract.recognize(file, "spa", {
    logger: (m: { status: string; progress: number }) => {
      if (!onProgress) return;
      if (m.status === "recognizing text") onProgress({ fase: "leyendo", progreso: m.progress });
      else onProgress({ fase: m.status, progreso: m.progress });
    },
  });

  return data.text;
}
