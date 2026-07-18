# AGENTS.md — PrecioJusto

## Propósito
App web responsive que lee tickets de súper por OCR y guarda el historial de
precios por producto y por súper, para consultarlo antes de volver a comprar.

## Stack
- Lenguaje: TypeScript
- Frontend: Next.js (React), responsive — móvil primero (usable hasta 390px sin scroll horizontal)
- Backend: API routes de Next.js (mismo repo, sin servidor aparte)
- Base de datos: SQLite
- OCR: Tesseract vía `tesseract.js` (local, sin API key)
- Node 20+ · gestor de paquetes: npm

## Cómo correr
- Instalar: `npm install`
- (Opcional) Datos de demo: `npm run seed`
- Levantar (dev): `npm run dev` → http://localhost:3000
- Build de producción: `npm run build`
- Tests: `npm test` (usa `node --test`)

La base SQLite se **genera sola** al arrancar (esquema en `db/schema.sql`); el
archivo `.db` no se versiona (ver `.gitignore`). El OCR corre en el navegador
con `tesseract.js` (la primera lectura baja el modelo de idioma; requiere
conexión). Ver el README para el detalle.

## Qué NO hacer
- Nunca asociar, fusionar ni renombrar productos de forma automática: el sistema
  sugiere candidatos por similitud, pero el usuario confirma siempre antes de guardar.
- No construir nada fuera del MVP: sin consulta de precio en góndola, métricas de
  consumo, normalización por USD, autenticación/multiusuario ni comparación de
  precios en tiempo real (eso es v2 o está fuera de alcance en el PRD).
- No mostrar comparaciones de precio histórico sin aclarar en la UI que están en
  pesos nominales (sin ajuste por inflación hasta la normalización por USD de v2).
