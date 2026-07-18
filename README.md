# PrecioJusto

App web responsive que **lee tickets de súper por OCR** y guarda el **historial de
precios por producto y por súper**, para consultarlo antes de volver a comprar.

Proyecto del curso *AI-First Builders Lab* (Módulo 3). Es la reconstrucción v2 —desde
el PRD y con red desde el primer commit— de la app hecha en el Módulo 2.

## Qué hace (MVP v1)

- **Registrar una compra**, a mano o **leyendo el ticket con la cámara** (OCR local).
- Al cargar, **sugiere productos parecidos del catálogo** para no fragmentar el
  historial — pero nunca asocia solo: el usuario confirma.
- **Historial de precios** de cada producto, separado por súper y cronológico
  (en pesos nominales, sin ajuste por inflación).
- **Buscar** un producto por nombre.
- **Unificar** el catálogo: **renombrar** y **fusionar** productos conservando su historial.

## Stack

- **Next.js 15** (App Router) + **TypeScript**, móvil primero (usable a 390px).
- **API routes** de Next.js (mismo repo, sin servidor aparte).
- **SQLite** vía `better-sqlite3`.
- **OCR**: Tesseract vía `tesseract.js`, en el navegador (local, sin API key).
- **Node 20+** (probado en 22). Gestor de paquetes: npm.

## Cómo correr

```bash
git clone https://github.com/Luissalli2/PrecioJustoIA_modulo3.git
cd PrecioJustoIA_modulo3
npm install
npm run seed     # opcional: carga súpers y productos de ejemplo
npm run dev      # http://localhost:3000
```

- La **base de datos se genera sola** al arrancar: no hay que crearla ni migrarla.
  El archivo `preciojusto.db` **no se versiona** (queda local).
- El **OCR** descarga el modelo de idioma la primera vez que leés un ticket, así
  que esa primera lectura necesita conexión (después queda cacheado).

### Otros comandos

```bash
npm run build    # build de producción
npm test         # tests (node --test)
```

## Cómo está organizado

```
db/schema.sql                  esquema SQLite (se aplica solo al arrancar)
db/seed.ts                     datos de demo (npm run seed)
src/lib/db.ts                  conexión + init automática
src/lib/repo/                  acceso a datos (súpers, productos, compras)
src/lib/services/              lógica de negocio (registrar compra)
src/lib/normalizar.ts          similitud fuzzy para sugerir productos
src/lib/ticket-parser.ts       OCR crudo -> ítems (productos y precios)
src/lib/ocr.ts                 preprocesado + Tesseract en el navegador
src/app/                       páginas y API routes (Next.js)
```

## Alcance

Esto es el **MVP (v1)**. Quedan fuera (v2 o fuera de alcance): consulta de precio en
góndola, métricas de consumo, normalización por dólar, autenticación/multiusuario y
comparación de precios en tiempo real.

**Pendiente dentro del v1**: la carga de un ticket en varias fotos (RF-09) todavía no
está implementada.

El detalle está en [`PRD.md`](./PRD.md); las reglas del proyecto, en [`AGENTS.md`](./AGENTS.md).
