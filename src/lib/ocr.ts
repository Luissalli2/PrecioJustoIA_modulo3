// OCR de tickets con Tesseract (tesseract.js), 100% en el navegador: local, sin
// API key (RF-01). La primera vez descarga el modelo de idioma y el wasm desde
// el CDN, así que requiere conexión; después queda cacheado.
//
// Antes de reconocer, se preprocesa la imagen (agrandar + escala de grises +
// contraste): los tickets suelen venir chicos y con poco contraste, y esto
// mejora bastante el reconocimiento. Si el preprocesado falla, se usa la foto
// original. El parseo del texto a ítems lo hace ticket-parser.ts (testeado).

export interface ProgresoOCR {
  fase: string; // "cargando modelo" | "leyendo" | …
  progreso: number; // 0..1
}

const ANCHO_MINIMO = 1500; // agrandar tickets chicos ayuda mucho a Tesseract

/** Agranda, pasa a gris y sube el contraste. Devuelve un canvas listo para OCR. */
async function preprocesar(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const escala = bitmap.width < ANCHO_MINIMO ? ANCHO_MINIMO / bitmap.width : 1;
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gris = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // Contraste moderado alrededor del medio (128).
    const v = Math.max(0, Math.min(255, (gris - 128) * 1.4 + 128));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Reconoce el texto de una imagen de ticket (idioma español). */
export async function reconocerTicket(
  file: File,
  onProgress?: (p: ProgresoOCR) => void,
): Promise<string> {
  // Import dinámico: tesseract.js solo se carga cuando el usuario sube una foto.
  const Tesseract = (await import("tesseract.js")).default;

  let entrada: File | HTMLCanvasElement = file;
  try {
    entrada = await preprocesar(file);
  } catch {
    entrada = file; // si el preprocesado falla, seguimos con la foto original
  }

  const { data } = await Tesseract.recognize(entrada, "spa", {
    logger: (m: { status: string; progress: number }) => {
      if (!onProgress) return;
      if (m.status === "recognizing text") onProgress({ fase: "leyendo", progreso: m.progress });
      else onProgress({ fase: m.status, progreso: m.progress });
    },
  });

  return data.text;
}
