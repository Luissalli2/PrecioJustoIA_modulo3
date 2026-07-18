# Memorias de desarrollo con IA — PrecioJusto

Registro de las decisiones y el avance de la construcción de la app asistida por IA
(curso "Desarrollo en red", Módulo 3). Este archivo **sí** vive en el repo: es el
registro del proyecto. La fuente de verdad sigue siendo el código, el `PRD.md` y el
`AGENTS.md`; esto es el "por qué" detrás de las decisiones.

## Plan de construcción (por etapas)

0. Esqueleto Next.js + SQLite ✅
1. Modelo de datos + capa de acceso ✅ (embebido en el paso 0)
2. Registro manual de una compra ✅
3. Catálogo, búsqueda e historial ✅
4. Unificación de productos (sugerir / fusionar / renombrar) ✅
5. OCR de tickets — pendiente
6. Carga en varias fotos (multi-foto) — pendiente
7. Cierre (repaso de los 23 AC + responsive 390px + versionado) — pendiente

## Decisiones clave

- **La base de datos se genera sola al clonar.** El `.db` NO se versiona (va al
  `.gitignore`). El esquema (`db/schema.sql`) sí, y la app lo aplica sola al primer
  acceso (`src/lib/db.ts`). Hay un seed de demo opcional (`npm run seed`). Motivo: el
  profesor clona y prueba; pasarle el `.db` sería subir datos personales y un binario
  que ensucia Git.
- **Driver `better-sqlite3`**: síncrono y con binarios precompilados → no hay que
  compilar nada al clonar.
- **Los repositorios reciben la conexión por parámetro** (no importan el singleton):
  se pueden testear con base en memoria (`:memory:`) sin tocar el `.db` real.
- **Normalización/similitud como funciones puras** desde el arranque: sostienen la
  regla de oro del `AGENTS.md` — el sistema *sugiere* candidatos, **nunca asocia,
  fusiona ni renombra solo**; el usuario confirma siempre.
- **Carga manual reutiliza producto por nombre exacto** (no fuzzy): evita duplicar el
  catálogo sin cruzar la línea de la asociación automática.
- **Búsqueda del lado del cliente** sobre el catálogo ya cargado (es chico, un solo
  usuario): instantánea y sin API extra.

## Registro de avance

### Paso 0 — Esqueleto Next.js + SQLite
Next.js 15 (App Router) + TS, capa de datos con init automática (tablas `supers`,
`productos`, `compras`, `items_compra`), repos testeados, normalización fuzzy, seed de
demo y `.gitignore` con `*.db`. Verificado: tests en verde, `npm run build` OK, home
renderiza datos leídos de SQLite.

### Paso 2 — Registro manual de una compra
Servicio `registrarCompraManual` (valida + crea/reutiliza súper y productos + guarda en
transacción), API `POST /api/compras`, formulario móvil-primero (`/compras/nueva`) con
súper de lista o nuevo, fecha precargada hoy e ítems dinámicos. Cubre AC-07, AC-15,
AC-16, AC-21, AC-23. Verificado end-to-end contra el server.

### Paso 3 — Catálogo, búsqueda e historial
Buscador en vivo en la home (RF-12, AC-20), página de historial `/productos/[id]`
agrupado por súper y cronológico (RF-05, AC-08) con precios en pesos nominales, helpers
de formato ($ es-AR y fecha DD/MM/AAAA). Verificado: historial correcto por súper,
precios formateados, 404 para id inexistente o no numérico.

### Paso 4 — Unificación de productos (la regla de oro del AGENTS)
Tres acciones que el usuario dispara y confirma; el sistema nunca decide solo.
- **Renombrar** (RF-08, AC-13): editar el nombre desde la página del producto conservando el historial. `PATCH /api/productos/[id]`.
- **Fusionar** (RF-07, AC-12): elegir productos que son el mismo y unir sus historiales sin duplicar; los absorbidos se eliminan. `POST /api/productos/fusionar`.
- **Sugerir** (RF-06, AC-09/10/11): al cargar una compra, el formulario busca coincidencias del catálogo por similitud y ofrece asociar a un producto existente. `GET /api/productos/candidatos` + soporte de `productoId` en la carga.
- Ajuste clave de la similitud: se le dio **peso al primer token** (el sustantivo del producto) para que "Leche entera 1L" y "LECHE SUP 1000CC" matcheen (AC-09), sin confundir cabezas distintas. Cada sub-paso quedó en su propio commit + push.

## Gotchas / aprendizajes

- **WSL + `next dev`**: el hot-reload NO detecta archivos nuevos cuando el repo está en
  `/mnt/c` (inotify no dispara en el filesystem de Windows). Tras crear páginas o rutas
  nuevas hay que **reiniciar** `next dev`, si no devuelve 404.
