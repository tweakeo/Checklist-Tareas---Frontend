# 🤝 Guía para Claude Desktop — Desplegar el Checklist en Cloudflare Pages

> **Para Claude Desktop:** esta es tu hoja de ruta. El frontend ya está construido y subido a GitHub. Tu trabajo es **desplegarlo en Cloudflare Pages** usando el conector de Cloudflare que el usuario (León) ya ha conectado, y dejarlo funcionando en modo *live* contra Notion. Lee esta guía entera antes de actuar.

## Contexto en una frase
Web táctil (para tablet) que muestra las tareas recurrentes de HOY del equipo de Chamberí/Paletos y permite marcarlas. **Marcar = crear un registro de ejecución en Notion** (no editar campos); el resto lo recalculan las fórmulas de Notion.

- **Repo (fuente de verdad):** `https://github.com/tweakeo/Checklist-Tareas---Frontend` (rama `main`)
- **Carpeta local:** `…/Home Developer/Desarrollos/Chamberí Brothers/Frontend Tareas`
- **Concepto técnico canónico:** `concepto.md` en el repo (léelo si necesitas detalle del modelo de datos)
- **Stack:** sitio estático (HTML/CSS/JS) + Cloudflare **Pages Functions** en `functions/api/` (`/api/today`, `/api/check`)

---

## ✅ Lo que ya está hecho (no lo rehagas)
- Frontend v0 completo y verificado en navegador (vistas HOY *por persona* y *por turno*, botón Check).
- `functions/api/today.js` y `functions/api/check.js` escritos y listos.
- Datos semilla en `data/seed.json` para el modo demo.
- Todo commiteado y **pusheado a GitHub `main`**.

## 🎯 Tu objetivo
1. Conectar el repo de GitHub a un proyecto nuevo de **Cloudflare Pages**.
2. Crear la variable secreta **`NOTION_TOKEN`**.
3. Re-desplegar y **verificar el modo live**.

---

## Paso 1 — Crear el proyecto de Pages conectado a Git
En Cloudflare (Workers & Pages → Create → **Pages** → Connect to Git):
- Repo: **`tweakeo/Checklist-Tareas---Frontend`**
- Production branch: **`main`**
- Framework preset: **None**
- Build command: **(vacío)**
- Build output directory: **`/`** (la raíz)
- Save and Deploy.

> Las Pages Functions de `functions/api/` se detectan automáticamente. No hay paso de build.

## Paso 2 — Crear el secreto `NOTION_TOKEN`
Proyecto → **Settings → Variables and secrets** → añadir:
- Nombre: **`NOTION_TOKEN`**
- Tipo: **Secret** (encriptado)
- Valor: el **token de integración interna de Notion**.

⚠️ **Requisito crítico del token:** la integración de Notion dueña de ese token **debe estar compartida** (invitada) con estas dos bases de datos, o las funciones devolverán 401/404:
- 🔁 **TAREAS RECURRENTES** — data source `361e4f0f-ad19-813b-81d2-000b0302a672`
- ✅ **REGISTRO DE TAREAS EJECUTADAS** — data source `262028f9-a188-4f8b-a1a3-5ff768906107`

> Se puede reutilizar el token de la integración que ya usa el MCP `notion-chamberi` (tiene acceso al workspace Chamberí/Paletos). Si León no lo tiene a mano, que lo copie desde notion.so → Settings → Connections → su integración interna, o cree una nueva y la comparta con las dos DBs de arriba.
>
> 🔒 **Nunca** escribas el token en el repo, en `concepto.md`, ni en el chat en claro. Va solo en el secreto de Cloudflare.

## Paso 3 — Re-desplegar
Tras guardar el secreto: **Deployments → Retry deployment** (las funciones solo leen las variables que existían al desplegar).

## Paso 4 — Verificar
La web da una URL tipo `https://checklist-tareas-frontend.pages.dev`.

1. **Demo (semilla):** abre `…/` → deben verse las tareas de ejemplo y el botón Check (no toca Notion).
2. **API directa:** abre `…/api/today` → debe devolver JSON con `tasks: [...]` (las tareas reales de HOY). Si da error, revisa el token y el acceso a las DBs.
3. **Live end-to-end:** abre `…/?live` → marca una tarea → debe:
   - desaparecer de la vista,
   - crear una fila nueva en *REGISTRO DE TAREAS EJECUTADAS* en Notion (con Fecha = hoy y la relación a la tarea),
   - y, al recargar, no reaparecer hasta el día siguiente.

## Si algo falla (debug)
- `/api/today` 401/403 → el token no tiene acceso a las DBs (Paso 2).
- `/api/today` 400 `invalid_request_url` → versión de API; las funciones usan **`Notion-Version: 2025-09-03`** (ya fijado en el código).
- `/api/check` 502 → mira el `detail` que devuelve la función; suele ser el nombre de una propiedad. Las propiedades esperadas en REGISTRO son `Tarea` (title), `Fecha` (date), `Plantilla` (relation).

## Cuando termines
- Apunta la **URL de producción** y avisa a León.
- (Opcional) dominio propio tipo `tareas.tweakeo.com` (CNAME en DonDominio → `<proyecto>.pages.dev`), como en el proyecto Roadmap.
- Actualiza el **Diario de desarrollo** de la página de Notion *SISTEMA DE TAREAS* con el resultado del despliegue.
