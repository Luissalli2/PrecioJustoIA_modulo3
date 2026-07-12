# PRD-001: PrecioJusto — historial de precios de súper (MVP v1)

> PrecioJusto es una app web responsive que lee tickets fotografiados, guarda el historial de precios por producto y súper, y permite consultarlo para decidir mejor al momento de comprar. La visión completa del producto incluye además consultar en góndola si un precio es conveniente respecto al histórico, métricas de consumo y normalización por tipo de cambio; este documento define el alcance del MVP (v1) y deja esas capacidades para una versión posterior (ver "Definido como v2").

## Contexto y Problema
Compro en varios supermercados y no tengo registro de qué compré, a qué precio ni dónde. Tampoco sé qué productos consumo más ni cómo evolucionan los precios en el tiempo. La inflación hace que comparar precios históricos en pesos sea impreciso. Hoy no tengo ninguna herramienta que me ayude con esto: los tickets quedan en el bolsillo y los tiro.

Para el MVP (v1) me enfoco en resolver lo más urgente: dejar de perder la información de los tickets y poder consultar el historial de precios de un producto antes de comprarlo de nuevo. La consulta instantánea en góndola, las métricas de consumo y la normalización por dólar quedan para una v2, una vez validado que el registro y la unificación de productos funcionan bien.

Personas:
- Usuario único: persona que compra en varios súpers y quiere dejar de perder el registro de tickets, para poder consultar después qué pagó por cada producto.

## Objetivos (v1)
Que el usuario pueda fotografiar un ticket y que la app lo lea automáticamente (con corrección manual cuando haga falta), unifique correctamente los productos entre súpers para no fragmentar el historial, y muestre el historial de precios por producto y súper para decidir mejor las próximas compras.

## Requerimientos Funcionales (v1)
- RF-01: El sistema debe permitir fotografiar un ticket y extraer automáticamente los productos y precios mediante OCR (la fecha y el nombre del súper no se obtienen por OCR: los indica el usuario, ver RF-11).
- RF-02: El sistema debe permitir al usuario corregir los productos y precios extraídos antes de confirmar el guardado.
- RF-03: El sistema debe permitir cargar productos y precios manualmente cuando el OCR no pueda leer el ticket.
- RF-04: El sistema debe almacenar cada compra con fecha, súper, y la lista de productos, guardando el precio por unidad de cada producto en esa compra.
- RF-05: El sistema debe mostrar el historial de precios de un producto, separado por súper, aclarando en la UI que los valores están en pesos nominales (sin ajuste por inflación).
- RF-06: Al confirmar una extracción, el sistema debe buscar productos existentes del catálogo por similitud de texto (fuzzy: normaliza mayúsculas, acentos y abreviaturas, y compara) y sugerir al usuario los candidatos encontrados; el usuario debe confirmar o rechazar la asociación antes de guardar, y el sistema nunca asocia el producto de forma automática (ej. "leche entera 1L" vs "leche SL 1000cc").
- RF-07: El sistema debe permitir al usuario fusionar dos o más productos existentes del catálogo en uno solo, en cualquier momento, uniendo sus historiales de precio.
- RF-08: El sistema debe permitir al usuario renombrar un producto existente del catálogo, en cualquier momento, conservando su historial de precios.
- RF-09: El sistema debe permitir cargar un mismo ticket en más de una foto (para tickets largos que no entran en una sola imagen): en una única acción de carga el usuario selecciona/toma varias fotos, y el sistema las procesa y consolida los productos de todas ellas en un único registro de compra.
- RF-10: El sistema debe funcionar de forma responsive para su uso desde el celular (usable hasta 390px de ancho sin scroll horizontal).
- RF-11: El sistema debe solicitar al usuario la fecha y el nombre del súper al iniciar la carga de un ticket (estos datos no se obtienen por OCR); el usuario puede modificarlos antes de confirmar el guardado.

## Requerimientos No Funcionales
- RNF-01: El OCR debe extraer los productos con una precisión ≥ 85% sobre tickets legibles.
- RNF-02: El resultado del OCR debe estar disponible en < 5 s (p95) tras subir la foto.
- RNF-03: Cuando el ticket se carga en varias fotos, la consolidación debe estar disponible en < 8 s (p95) tras subir la última foto.

## Criterios de Aceptación
- AC-01 (RF-01): Dado un ticket fotografiado con 10 productos legibles, cuando se procesa, entonces la app muestra al menos 9 productos cuyo nombre y precio coinciden con lo impreso en el ticket.
- AC-02 (RF-01): Dado un ticket con imagen borrosa o muy arrugada, cuando se procesa, entonces la app informa que no pudo leerlo en lugar de mostrar datos incorrectos.
- AC-03 (RF-01 / RF-02): Dado un ticket con una línea de descuento o promoción (ej. "2x1", "desc. 10%"), cuando se procesa, entonces la app no la registra como un producto nuevo; el usuario puede ajustar el precio del producto afectado al precio final pagado antes de confirmar (vía RF-02).
- AC-04 (RF-01): Dado un ticket con el mismo producto en dos líneas distintas (ej. 2 unidades cargadas por separado), cuando se procesa, entonces la app las consolida en un único ítem del ticket (sin duplicar la línea), conservando el precio por unidad; la asociación de ese ítem a un producto del catálogo se resuelve vía RF-06 (el usuario confirma, y si es un producto nuevo lo verifica manualmente).
- AC-05 (RF-02): Dado un producto extraído con precio incorrecto, cuando el usuario lo edita y confirma, entonces el precio corregido queda guardado y el original descartado.
- AC-06 (RF-03): Dado un ticket ilegible, cuando el OCR no puede procesarlo, entonces la app informa el error y habilita la carga manual.
- AC-07 (RF-04): Dado un ticket procesado con 5 productos confirmados, cuando el usuario guarda, entonces la compra queda registrada con fecha, nombre del súper y los 5 productos con sus precios.
- AC-08 (RF-05): Dado un producto comprado en 3 súpers distintos, cuando el usuario lo consulta, entonces ve el historial de precios separado por súper.
- AC-09 (RF-06): Dado un producto "Leche entera 1L" ya en el catálogo, cuando el OCR extrae "LECHE SUP 1000CC" de un ticket nuevo, entonces la app detecta la similitud y se lo sugiere al usuario para asociarlo al mismo producto, sin asociarlo hasta que el usuario lo confirme.
- AC-10 (RF-06 — producto ambiguo): Dado que el sistema encuentra más de un producto similar en el catálogo (ej. "Leche entera 1L" y "Leche descremada 1L"), cuando el usuario confirma la extracción, entonces la app le pide elegir cuál es el correcto o crear uno nuevo, sin asociarlo automáticamente.
- AC-11 (RF-06 — producto nuevo): Dado un producto extraído que no coincide con ningún producto del catálogo, cuando el usuario confirma la extracción, entonces la app lo registra como un producto nuevo del catálogo, sin sugerir ninguna asociación.
- AC-12 (RF-07): Dado dos productos existentes en el catálogo que el usuario identifica como el mismo producto, cuando los selecciona y confirma la fusión, entonces quedan combinados en un único producto y sus historiales de precio se unen sin duplicarse.
- AC-13 (RF-08): Dado un producto existente en el catálogo, cuando el usuario edita su nombre y confirma, entonces el producto se muestra con el nuevo nombre y conserva todo su historial de precios previo, sin crear un producto nuevo.
- AC-14 (RF-09): Dado un ticket que no entra en una sola foto, cuando el usuario selecciona 2 o más fotos en una misma acción de carga, entonces la app las procesa juntas y consolida los productos de todas las fotos en un único registro de compra.
- AC-15 (RF-10): Dado un usuario accediendo desde un celular con pantalla de 390px de ancho, cuando abre la app, entonces todos los elementos son visibles y operables sin scroll horizontal.
- AC-16 (RF-11): Dado que el usuario inicia la carga de un ticket, cuando comienza la carga, entonces la app le pide la fecha y el nombre del súper (no obtenidos por OCR) y esos valores quedan asociados a la compra; el usuario puede modificarlos antes de confirmar.
- AC-17 (RNF-01): Dado un set de prueba de 20 tickets legibles con un total conocido de 200 productos impresos, cuando se procesan todos por OCR, entonces al menos 170 de esos 200 productos (≥ 85%) se extraen con nombre y precio coincidentes con lo impreso en el ticket.
- AC-18 (RNF-02): Dado un ticket legible recién fotografiado, cuando el usuario sube la foto, entonces el resultado del OCR está disponible en menos de 5 s en al menos el 95% de los casos (p95).
- AC-19 (RNF-03): Dado un ticket cargado en varias fotos, cuando el usuario sube la última foto, entonces la consolidación de los productos de todas las fotos está disponible en menos de 8 s en al menos el 95% de los casos (p95).

## Fuera de Alcance (v1)
- Integración con apps de supermercados o bases de precios online.
- Compartir historial con otras personas.
- Presupuesto o planificación de compras.
- Autenticación y multi-usuario.
- Comparación de precios entre súpers en tiempo real.
- Paginación del historial (en v1 se muestran los últimos 100 registros).
- Edición o borrado de una compra ya confirmada: en v1, una vez guardada, la compra no se puede modificar ni eliminar (candidato a v2).

> Nota: las referencias "(era RF-XX en el PRD v1)" apuntan a la numeración del documento anterior `PRD_PrecioJusto_v1.md`, no a los RF de este documento.

## Definido como v2 (posterior al MVP)
- **Consulta de conveniencia de precio en góndola**: fotografiar el precio en góndola, extraer producto y precio, y comparar contra el promedio histórico del producto en ese súper (era RF-06 y RF-09 en el PRD v1). Se pospone hasta validar que el registro por ticket y la unificación de productos (RF-06, RF-07 y RF-08 de este documento) funcionan bien; si el historial está fragmentado, la comparación en góndola no sería confiable. Al especificar v2, sumar criterios de aceptación para los casos: (a) foto de góndola con producto y precio legibles → muestra historial; (b) foto donde se lee el precio pero no el nombre del producto → la app pide al usuario elegir/confirmar el producto manualmente antes de comparar.
- **Métricas de consumo**: productos más comprados, gasto total por mes y por supermercado (era RF-07 en el PRD v1).
- **Normalización de precios por tipo de cambio (USD)**: cargar el tipo de cambio de cada compra y mostrar precios históricos convertidos al tipo de cambio actual, incluyendo la validación de formato de precio y tipo de cambio y la definición de qué ocurre si el usuario no carga el tipo de cambio (era RF-10 en el PRD v1). Nota: hasta que esto se implemente, los precios históricos se comparan en pesos nominales; en un contexto inflacionario esa comparación puede ser engañosa, y conviene aclararlo en la UI.

## Riesgos y Dependencias
- Riesgo: el OCR falla con tickets arrugados, mal iluminados o con fuente muy pequeña → mitigación: RF-03 permite carga manual como alternativa siempre disponible.
- Riesgo: los tickets largos (la mayoría) pueden no entrar en una sola foto y perder productos → mitigación: RF-09 permite cargar el mismo ticket en varias fotos y consolidarlas.
- Riesgo: distintos súpers usan nombres distintos para el mismo producto, fragmentando el historial → mitigación: RF-06 (sugerencia automática de coincidencia), con RF-07 (fusión manual) y RF-08 (renombrado manual) como respaldo.
- Riesgo: al posponer la normalización por dólar a v2, comparar precios históricos en pesos nominales puede ser engañoso en un contexto inflacionario → mitigación: aclarar en la UI que la comparación es en pesos nominales hasta que se implemente v2.
- Dependencia: API de OCR o modelo de visión para lectura de tickets.
- Dependencia: backend con base de datos para persistir compras, productos, precios y supermercados. Los datos se guardan en el servidor (no solo en el dispositivo), por lo que persisten aunque el usuario cambie de equipo o borre el navegador. Esto agrega infraestructura al MVP, pero deja mejor preparada la base para las funcionalidades de v2 (góndola, métricas, tipo de cambio).

## Stack técnico (fijado)
El stack del proyecto ya está decidido (ver AGENTS.md); se deja acá como referencia (no es un requerimiento de producto):
- Front: Next.js (React) + TypeScript, responsive (móvil primero).
- Back: API routes de Next.js (mismo repo, sin servidor aparte).
- OCR: Tesseract vía `tesseract.js` (local, sin API key).
- Base de datos: SQLite para compras, productos, precios y supermercados.
- Runtime: Node 20+.
