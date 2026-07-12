---
name: create-prd
description: Crea o audita un PRD siguiendo el template y el checklist de calidad del curso, con un loop de auditar → el usuario juzga → reescribir lo aprobado. Usar cuando el usuario pide crear, escribir, revisar, auditar, endurecer o "afilar" un PRD o documento de requerimientos. No inventa features ni reescribe sin aprobación.
---

# create-prd

Toma un PRD (o lo arma desde cero) y lo endurece en un loop, no de una sola pasada.
El PRD es un contrato: cada hueco que se tapa hoy es un bug que no aparece cuando ya
está enterrado bajo miles de líneas de código.

## Reglas que no se negocian

- **No inflar el scope.** No agregar features que el usuario no pidió; ante la duda, preguntar. Lo que no resuelve un dolor real va a "Fuera de Alcance".
- **No ablandar criterios.** Nada de "rápido", "correcto" o "adecuado": cada criterio pasa o no pasa, y cada número es concreto (ej. "< 3 s p95").
- **El usuario decide.** La IA propone los hallazgos; el usuario juzga cuáles valen. No aplicar ningún cambio sin su OK.

## Pasos

1. **Ubicar el punto de partida.**
   - **PRD nuevo (desde cero):** hacer TODAS las preguntas necesarias ANTES de escribir una línea — el dolor real, las personas, las features core, las restricciones. No inventar requerimientos.
   - **PRD existente** (por defecto `PRD.md`; si no está, preguntar la ruta): leerlo y, si no está en Markdown limpio, pasarlo a Markdown. Trabajar solo con ese documento.
2. **Normalizar la estructura** contra el template de abajo: marcar qué secciones faltan o están fuera de lugar; si falta alguna, agregar el encabezado vacío para dejar el molde completo. No inventar contenido, solo ordenar.
3. **Auditar el contenido** con el checklist, hallazgo por hallazgo, diciendo dónde está y por qué. Marcar los debatibles como tales, para que el usuario pueda rechazarlos con criterio.
4. **El usuario juzga** cada hallazgo (cuáles sí, cuáles no, cuáles van a "Fuera de Alcance").
5. **Reescribir solo lo aprobado** y dejar el resto igual. IDs estables: agregar al final o renumerar en cadena, avisando el criterio usado.
6. **Volver a auditar** sobre la versión nueva. Repetir hasta que la auditoría venga limpia o solo con humo que el usuario ya sabe rechazar.

## Template

```
# PRD-001: <proyecto> — <una línea de qué es>
## Contexto y Problema           (el dolor real y para quién; personas: quién lo usa y qué necesita)
## Objetivos                     (qué significa ganar, a nivel producto)
## Requerimientos Funcionales    (RF-01, RF-02, … — "El sistema debe <una sola acción>")
## Requerimientos No Funcionales (RNF-01, … — cualidad CON número: "< 3 s p95", "≥ 85%")
## Criterios de Aceptación       (AC-01 (RF-01): Dado <contexto>, cuando <acción>, entonces <resultado medible>)
## Fuera de Alcance              (lo que explícitamente NO entra)
## Riesgos y Dependencias        (riesgo → mitigación; de qué depende)
```

## Checklist de auditoría

- Cada RF es atómico (una sola acción) y dice "debe".
- Cada RNF tiene un número concreto (no "rápido").
- Cada RF tiene al menos un AC que lo verifique.
- Cada AC es binario (pasa/no pasa) y está en formato Dado/Cuando/Entonces.
- "Fuera de Alcance" está explícito.
- AC de control de acceso: solo aplica si hay multiusuario/login. Si el proyecto es de un solo usuario y así está en "Fuera de Alcance", NO agregarlo — defender la exclusión, no inflar el scope.

## Listo cuando

El PRD tapó al menos un hueco real, se dio más de una vuelta de auditoría, se rechazó al menos una sugerencia de la IA, y el usuario puede defender cada línea.
