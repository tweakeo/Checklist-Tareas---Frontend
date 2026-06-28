/* =====================================================================
   Tareas de Hoy — Chamberí Brothers
   Modo SEED (data/seed.json) por defecto · modo LIVE con ?live (usa /api/*)
   "Marcar" = crear un registro de ejecución (en LIVE lo hace el proxy).

   Filtros TURNO × PERSONA: independientes y apilables (lógica AND).
   P.ej. 🌅 Apertura + León, o 🌙 Cierre + Chopo. La agrupación del tablero
   se adapta a lo que esté fijado (ver currentGrouping / buildGroups).
   ===================================================================== */

const CONFIG = {
  live: new URLSearchParams(location.search).has("live"),
  seedUrl: "data/seed.json",
  apiToday: "/api/today",
  apiCheck: "/api/check",
};

const TURNO_ORDER = ["🌅 Apertura", "🍽️ Servicio", "🌆 Entreturnos", "🌙 Cierre", "📆 Semanal", "🗓️ Mensual", "Sin turno"];
const PERSON_ORDER = ["León", "Alex", "Chopo", "Manu", "Equipo"];
const PERSON_COLOR = {
  "León": "var(--r-leon)", "Alex": "var(--r-alex)", "Chopo": "var(--r-chopo)",
  "Manu": "var(--r-manu)", "Equipo": "var(--r-equipo)",
};

const state = {
  tasks: [],
  turno: null,           // null = todos los turnos
  person: null,          // null = todas las personas
  done: new Set(),
  source: "semilla",
};

const $ = (s) => document.querySelector(s);
const board = $("#board");

/* ---------------- DATA ---------------- */
async function loadTasks() {
  board.innerHTML = '<div class="loading">Cargando tareas…</div>';
  try {
    if (CONFIG.live) {
      const r = await fetch(CONFIG.apiToday, { cache: "no-store" });
      if (!r.ok) throw new Error("api " + r.status);
      const data = await r.json();
      state.tasks = data.tasks || [];
      state.source = "Notion (live)";
    } else {
      const r = await fetch(CONFIG.seedUrl, { cache: "no-store" });
      const data = await r.json();
      state.tasks = data.tasks || [];
      state.source = "semilla · " + (data.generatedAt || "");
    }
  } catch (e) {
    state.tasks = [];
    toast("No se pudieron cargar las tareas", true);
    console.error(e);
  }
  state.done.clear();
  // Si un filtro activo ya no existe en los datos cargados, lo soltamos.
  if (state.turno && !taskTurnos().includes(state.turno)) state.turno = null;
  if (state.person && !taskPersons().includes(state.person)) state.person = null;
  $("#sourceLabel").textContent = "datos: " + state.source;
  render();
}

/* ---------------- HELPERS ---------------- */
function pending() { return state.tasks.filter((t) => !state.done.has(t.id)); }
function personsOf(t) { return t.responsables.length ? t.responsables : ["Sin asignar"]; }
function turnoOf(t) { return t.turno || "Sin turno"; }

function uniqueByOrder(values, order) {
  const set = new Set(values);
  const ordered = order.filter((v) => set.has(v));
  const rest = [...set].filter((v) => !order.includes(v));
  return [...ordered, ...rest];
}

function taskTurnos() { return uniqueByOrder(state.tasks.map(turnoOf), TURNO_ORDER); }
function taskPersons() { return uniqueByOrder(state.tasks.flatMap(personsOf), PERSON_ORDER); }

// ¿La tarea pasa los filtros activos (turno Y persona)? Ignora el estado "hecha".
function matchesFilters(t) {
  const okTurno = !state.turno || turnoOf(t) === state.turno;
  const okPerson = !state.person || personsOf(t).includes(state.person);
  return okTurno && okPerson;
}

// Agrupamos por la dimensión que NO está fijada. Si ambas están fijadas → lista plana.
function currentGrouping() {
  if (state.turno && state.person) return null;
  if (state.turno && !state.person) return "persona";
  return "turno"; // (persona fijada con turno libre) o (sin filtros) → línea de turnos
}

function prioClass(p) {
  if (!p) return "";
  const k = p.toLowerCase();
  if (k.startsWith("core")) return "tag--prio-core";
  if (k.startsWith("alta")) return "tag--prio-alta";
  if (k.startsWith("media")) return "tag--prio-media";
  return "tag--prio-baja";
}
function esc(s) { return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ---------------- RENDER ---------------- */
function render() {
  renderScore();
  renderFilters();
  const groups = buildGroups();
  board.innerHTML = "";

  const hasAny = groups.some((g) => g.tasks.length > 0);
  const scopeTotal = state.tasks.filter(matchesFilters).length;
  if (!hasAny) {
    const empty = $("#emptyState");
    if (scopeTotal === 0) {
      empty.querySelector("h2").textContent = "Sin tareas aquí";
      empty.querySelector("p").textContent = "No hay tareas para esta combinación de filtros.";
    } else {
      empty.querySelector("h2").textContent = "¡Todo hecho!";
      empty.querySelector("p").textContent = "No quedan tareas pendientes en esta vista. Buen trabajo.";
    }
  }
  $("#emptyState").hidden = hasAny;
  board.hidden = !hasAny;
  if (!hasAny) return;

  for (const g of groups) {
    if (!g.tasks.length) continue;
    const sec = document.createElement("section");
    sec.className = "group";
    sec.innerHTML = `
      <div class="group__head">
        <span class="group__title">
          ${g.dot ? `<span class="group__dot" style="background:${g.dot}"></span>` : ""}${esc(g.title)}
        </span>
        <span class="group__count">${g.tasks.length} pdte${g.tasks.length === 1 ? "" : "s"}</span>
      </div>
      <div class="group__list"></div>`;
    const list = sec.querySelector(".group__list");
    for (const t of g.tasks) list.appendChild(taskCard(t));
    board.appendChild(sec);
  }
}

function buildGroups() {
  const p = pending().filter(matchesFilters);
  const g = currentGrouping();

  if (g === "turno") {
    const turnos = uniqueByOrder(p.map(turnoOf), TURNO_ORDER);
    return turnos.map((turno) => ({
      title: turno,
      tasks: p.filter((t) => turnoOf(t) === turno),
    }));
  }
  if (g === "persona") {
    const persons = uniqueByOrder(p.flatMap(personsOf), PERSON_ORDER);
    return persons.map((person) => ({
      title: person,
      dot: PERSON_COLOR[person] || "var(--pc-grey-500)",
      tasks: p.filter((t) => personsOf(t).includes(person)),
    }));
  }
  // Ambos filtros fijados → una sola lista, con el combo como cabecera.
  return [{
    title: `${state.turno} · ${state.person}`,
    dot: PERSON_COLOR[state.person] || null,
    tasks: p,
  }];
}

function taskCard(t) {
  const g = currentGrouping();
  // Mostramos una etiqueta solo si aporta info: ni está fijada por el filtro ni es la cabecera de grupo.
  const showTurno = !state.turno && g !== "turno";
  const showPersons = !state.person && g !== "persona";

  const el = document.createElement("article");
  el.className = "task";
  el.dataset.id = t.id;
  const tags = [];
  if (showTurno && t.turno) tags.push(`<span class="tag tag--turno">${esc(t.turno)}</span>`);
  if (showPersons) personsOf(t).forEach((r) => tags.push(`<span class="tag" style="border-color:${PERSON_COLOR[r] || "var(--pc-ink)"}">${esc(r)}</span>`));
  if (t.prioridad) tags.push(`<span class="tag ${prioClass(t.prioridad)}">${esc(t.prioridad)}</span>`);
  if (t.mins) tags.push(`<span class="tag tag--mins">${t.mins}′</span>`);
  el.innerHTML = `
    <div class="task__main">
      <p class="task__name">${esc(t.tarea)}</p>
      <div class="task__meta">${tags.join("")}</div>
    </div>
    <button class="checkbtn" aria-label="Marcar como hecha: ${esc(t.tarea)}">
      <span class="checkbtn__icon">✓</span>Check
    </button>`;
  el.querySelector(".checkbtn").addEventListener("click", () => check(t, el));
  return el;
}

function renderScore() {
  const scope = state.tasks.filter(matchesFilters);
  const doneInScope = scope.filter((t) => state.done.has(t.id)).length;
  $("#scoreDone").textContent = doneInScope;
  $("#scoreTotal").textContent = scope.length;
  $("#dateLabel").textContent = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

/* ---------------- FILTER BARS (turno × persona, apilables) ---------------- */
function renderFilters() {
  renderFilterBar({
    bar: $("#turnoBar"),
    label: "Turno",
    values: taskTurnos(),
    active: state.turno,
    colorOf: () => null,
    onPick: (v) => { state.turno = v; render(); },
  });
  renderFilterBar({
    bar: $("#personBar"),
    label: "Persona",
    values: taskPersons(),
    active: state.person,
    colorOf: (v) => PERSON_COLOR[v] || null,
    onPick: (v) => { state.person = v; render(); },
  });
}

function renderFilterBar({ bar, label, values, active, colorOf, onPick }) {
  const chip = (text, value) => {
    const color = value === null ? null : colorOf(value);
    return `<button class="chip ${active === value ? "is-active" : ""}" data-value="${value === null ? "" : esc(value)}">
      ${color ? `<span class="chip__dot" style="background:${color}"></span>` : ""}${esc(text)}
    </button>`;
  };
  bar.innerHTML =
    `<span class="filterrow__label">${esc(label)}</span>` +
    chip("Todos", null) +
    values.map((v) => chip(v, v)).join("");
  // Reconstruimos el mapa valor↔índice para no depender de re-escapar el dataset.
  const buttons = [...bar.querySelectorAll(".chip")];
  const order = [null, ...values];
  buttons.forEach((b, i) => b.addEventListener("click", () => onPick(order[i])));
}

/* ---------------- CHECK ACTION ---------------- */
function check(t, el) {
  if (state.done.has(t.id)) return;
  state.done.add(t.id);
  renderScore();
  el.classList.add("is-checking");
  setTimeout(() => el.classList.add("is-done"), 130);
  setTimeout(render, 470);
  toast(`✓ ${t.tarea}`);

  if (CONFIG.live) {
    fetch(CONFIG.apiCheck, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: t.id, tarea: t.tarea }),
    }).then((r) => { if (!r.ok) throw new Error("check " + r.status); })
      .catch((e) => {
        console.error(e);
        state.done.delete(t.id);   // rollback
        toast("Error al marcar. Reintenta.", true);
        renderScore(); render();
      });
  }
}

/* ---------------- UI CHROME ---------------- */
let toastTimer;
function toast(msg, isError) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("is-error", !!isError);
  el.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-show"), 2200);
}

$("#reloadBtn").addEventListener("click", loadTasks);

loadTasks();

// Las cabeceras de grupo se anclan justo debajo de la cabecera fija (altura variable).
(function () {
  const head = document.querySelector(".stickyhead");
  if (!head) return;
  const setH = () => document.documentElement.style.setProperty("--head-h", head.offsetHeight + "px");
  setH();
  if (window.ResizeObserver) new ResizeObserver(setH).observe(head);
  window.addEventListener("resize", setH);
})();
