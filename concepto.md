# Checklist de Tareas — Frontend · `concepto.md`

> **Doc canónico vivo.** Cualquier cambio de concepto se refleja aquí, con una entrada en el CHANGELOG al final. La página de Notion "SISTEMA DE TAREAS" (HEADQUARTERS › PROYECTOS & MEJORA CONTINUA) es el resumen ejecutivo; este archivo manda en lo técnico.

## 1. Qué es

Web ligera, muy visual y táctil (uso desde **tablet** en el local) para que el equipo de Chamberí Brothers / Paletos marque sus **tareas recurrentes diarias** con botones grandes tipo "Check", montada sobre el sistema que ya vive en Notion.

Estética: **design system de Paletos Club**.

## 2. El sistema en Notion (sobre el que se monta)

Vive bajo **HEADQUARTERS › OPERATIVA DIARIA**. La DB multi-fuente **✅ CHECKLIST DE TAREAS** es realmente un conjunto de vistas sobre estas fuentes de datos:

| Fuente | data_source_id | Rol |
|---|---|---|
| 🔁 TAREAS RECURRENTES (biblioteca) | `361e4f0f-ad19-813b-81d2-000b0302a672` | Define cada tarea recurrente |
| ✅ REGISTRO DE TAREAS EJECUTADAS (historial) | `262028f9-a188-4f8b-a1a3-5ff768906107` | Un registro por cada marcaje |
| 🌟 TAREAS EMERGENTES | `361e4f0f-ad19-81f5-95d8-000bb16bf0aa` | Puntuales (fuera de v1) |

DB contenedora `CHECKLIST DE TAREAS`: `2b8fda83-42a1-4210-9fbd-525d76aa955e`.
DB `TAREAS RECURRENTES`: `361e4f0f-ad19-8057-aa3e-c193784c2046`.

### Campos de la biblioteca (TAREAS RECURRENTES)

- `TAREA` (title), `RESPONSABLE` (multi: León, Alex, Chopo, Manu, Equipo), `TURNO` (select: 🌅 Apertura / 🍽️ Servicio / 🌆 Entreturnos / 🌙 Cierre / 📆 Semanal / 🗓️ Mensual), `CATEGORÍA` (multi), `DÍA` (multi: Lunes…Domingo), `FRECUENCIA`, `PRIORIDAD` (Baja/Media/Alta/Core), `TIEMPO (mins)` (number).
- `CHECK` (button), `EJECUCIONES` (relación → historial), `Última ejecución` (rollup latest_date), y dos **fórmulas de texto**:

```
ES HOY = if(contains(format(join(DÍA, ", ")), <nombre del día de hoy>), "true", "false")

Hecha hoy = if(empty(Última ejecución), "false",
              if(dateBetween(Última ejecución, now(), "days") == 0, "true", "false"))
```

### El mecanismo clave (no hay "reset")

No existe ningún campo que se borre cada noche. Todo es **relativo a hoy**:

1. `ES HOY` = true si la tarea aplica al día de la semana actual.
2. Al pulsar **CHECK**, Notion crea un registro en el historial con `Fecha = hoy` y la relación a la tarea.
3. El rollup `Última ejecución` pasa a hoy → la fórmula `Hecha hoy` = true → la tarea sale de la vista HOY.
4. Al cambiar el día, `dateBetween(Última ejecución, now())` deja de ser 0 → `Hecha hoy` vuelve a false **solo** → la tarea reaparece.

Las vistas HOY filtran `ES HOY = "true"` **y** `Hecha hoy = "false"`.

## 3. Cómo lo replica el frontend

- **Leer tareas de HOY**: query a la fuente de la biblioteca filtrando `ES HOY = "true"` y `Hecha hoy = "false"` (filtros de tipo string sobre fórmula).
- **Filtrar la vista — TURNO × PERSONA, apilables**: dos barras de filtro independientes que se combinan con lógica AND (p.ej. `🌅 Apertura + León`, `🌙 Cierre + Chopo`). Cada barra es mono-selección con opción "Todos". La **agrupación es adaptativa**: si solo se fija la persona → se agrupa por turno; si solo se fija el turno → se agrupa por persona; si se fijan ambos → lista única con el combo como cabecera; sin filtros → vista general por turno. El marcador "hechas" refleja el ámbito filtrado.
- **Marcar (Check)**: NO se edita un campo — se **crea una página** en REGISTRO DE TAREAS EJECUTADAS:
  - parent `data_source_id = 262028f9-a188-4f8b-a1a3-5ff768906107`
  - `Tarea` (title) = nombre de la tarea
  - `Fecha` (date) = hoy
  - `Plantilla` (relation) = [id de la tarea de la biblioteca]
  - `Semana` (date, opcional) = semana actual
  - Tras crearlo, Notion recalcula rollup + fórmulas; el frontend solo re-consulta.
- **Deshacer** (opcional v2): archivar/borrar el registro de ejecución de hoy.

## 4. Arquitectura (propuesta)

- Escribir en Notion exige un token de integración que **no puede ir en el cliente**.
- Patrón recomendado (igual que el proyecto Roadmap): **frontend estático + proxy serverless** (Cloudflare Worker) que guarda el token server-side y expone 2 endpoints: `GET /today` y `POST /check`.
- Hosting: Cloudflare Pages, autodeploy en push a `main`.
- Notion API version: `2025-09-03`.

## 5. Alcance v1

- ✅ Vista "HOY" con tarjetas grandes + botón Check, filtrable por **turno y persona apilables** (ver §3).
- ✅ Marcar tarea (crea ejecución) + feedback inmediato.
- ❌ Edición de la biblioteca (se sigue en Notion).
- ❌ Tareas emergentes / de proyectos.

## CHANGELOG

- **2026-06-28** — Las vistas "Por persona" y "Por turno" dejan de ser modos excluyentes y pasan a ser **dos filtros independientes y apilables** (turno × persona, lógica AND), con agrupación adaptativa y marcador por ámbito filtrado. Verificado en local (modo semilla).
- **2026-06-25** — Creación del documento. Revisión del sistema en Notion, modelo de datos y fórmulas confirmadas vía API. Repo inicializado.
