# Checklist de Tareas — Frontend

Frontend visual y táctil (uso desde **tablet**) para marcar las tareas recurrentes diarias del equipo de **Chamberí Brothers / Paletos**, montado sobre el sistema que vive en Notion (HEADQUARTERS › OPERATIVA DIARIA). Estética: **design system de Paletos Club**.

- 📄 **Concepto técnico canónico:** [`concepto.md`](./concepto.md)
- 🗂️ **Proyecto en Notion:** HEADQUARTERS › PROYECTOS & MEJORA CONTINUA › *SISTEMA DE TAREAS*
- 🎨 **Design System:** `…/Chamberí Brothers/Paletos Club/Design System/`

## Cómo funciona (resumen)

1. La web lee las tareas de **HOY** desde la biblioteca de Notion (filtra las fórmulas `ES HOY = true` y `Hecha hoy = false`).
2. Al pulsar **Check**, crea un registro en *REGISTRO DE TAREAS EJECUTADAS* (no edita campos).
3. Notion recalcula los rollups/fórmulas: la tarea desaparece de HOY y, al día siguiente, reaparece sola.

## Estado

🚧 En kickoff — ver checkpoints en `concepto.md` y en la página de Notion.

## Stack (previsto)

- Frontend estático optimizado para tablet (botones grandes, alto contraste).
- Proxy serverless (Cloudflare Worker) con el token de Notion server-side.
- Notion API `2025-09-03`.
