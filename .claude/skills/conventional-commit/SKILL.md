---
name: conventional-commit
description: Redacta el mensaje de un commit con el formato Conventional Commits (tipo(scope): descripción). Se usa al crear un commit, al versionar cambios, o cuando el usuario pide un mensaje de commit o dice "commiteá esto".
---

# conventional-commit

Antes de escribir el mensaje, mirá QUÉ cambió con `git diff --staged` (si no hay nada en el stage, revisá `git status` y `git diff`). El mensaje describe el cambio real, no lo que pensabas hacer.

## Formato

`tipo(scope): descripción`

- **tipo** (obligatorio): `feat` (feature nueva), `fix` (arreglo de bug), `docs` (documentación), `refactor` (reordenar sin cambiar comportamiento), `test` (tests), `chore` (mantenimiento, config, dependencias).
- **scope** (opcional): la parte del proyecto que toca, entre paréntesis (ej. `prd`, `skills`, `ocr`, `historial`).
- **descripción**: en imperativo y minúscula ("agregar", no "agregado" ni "agrega"), sin punto final, ≤ 72 caracteres.

## Reglas

- Un commit, una intención: si el diff hace dos cosas distintas, avisar que conviene separarlo en dos commits.
- Si el cambio rompe compatibilidad, sumar una línea `BREAKING CHANGE: <qué se rompe>` en el cuerpo.
- El cuerpo (opcional, después de una línea en blanco) explica el porqué cuando la descripción sola no alcanza.

## Ejemplos

- `feat(ocr): consolidar líneas repetidas de un mismo ticket`
- `fix(historial): ordenar los precios por fecha`
- `docs(prd): aclarar que el historial se muestra en pesos nominales`
- `chore(skills): agregar skill conventional-commit`
