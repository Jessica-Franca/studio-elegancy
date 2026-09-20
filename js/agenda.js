(function () {
  const root = document.getElementById("agenda-root");
  if (!root) return;

  const MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  const PROS = ["Bruna", "Amanda"];

  let mode = "day";
  let lastMode = "day";
  let selected = window.StudioState.today;
  let rangeStart = selected;
  let rangeEnd = selected;
  const filters = {
    profissionais: [],
    clienteIds: [],
    servicoIds: [],
    statuses: []
  };
  let columnSort = null;
  const SORT_GETTERS = {
    date: { type: "date", value: (row) => row.date || "" },
    time: { type: "text", value: (row) => row.time || "" },
    client: { type: "text", value: (row) => row.clientName || "" },
    service: { type: "text", value: (row) => row.servicoNome || "" },
    pro: { type: "text", value: (row) => row.profissional || "" },
    value: { type: "number", value: (row) => row.valor || 0 },
    status: {
      type: "status",
      value: (row) => row.status || "",
      rank: { agendado: 0, confirmado: 1, concluido: 2, cancelado: 3 }
    }
  };
  const MS = {
    profissional: { title: "Profissional", empty: "Todas", feminine: true, search: false },
    cliente: { title: "Cliente", empty: "Todas", feminine: true, search: true },
    servico: { title: "Serviço", empty: "Todos", feminine: false, search: true },
    status: { title: "Status", empty: "Todos", feminine: false, search: false }
  };
  const CATEGORY_ORDER = ["Unhas", "Cílios", "Sobrancelhas"];

  function todayIso() {
    return window.StudioState.today;
  }

  function fromIso(iso) {
    const [year, month, day] = String(iso).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function toIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(iso, amount) {
    const date = fromIso(iso);
    date.setDate(date.getDate() + amount);
    return toIso(date);
  }

  function addMonths(iso, amount) {
    const date = fromIso(iso);
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + amount);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, last));
    return toIso(date);
  }

  function startOfWeek(iso) {
    const date = fromIso(iso);
    const weekday = date.getDay();
    const offset = weekday === 0 ? -6 : 1 - weekday;
    date.setDate(date.getDate() + offset);
    return toIso(date);
  }

  function monthStart(iso) {
    const date = fromIso(iso);
    return toIso(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function monthEnd(iso) {
    const date = fromIso(iso);
    return toIso(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  }

  function labelBR(iso) {
    return window.labelDate(iso);
  }

  function shortLabel(iso) {
    const [year, month, day] = String(iso).split("-");
    if (mode === "range" && rangeStart.slice(0, 4) !== rangeEnd.slice(0, 4)) {
      return `${day}/${month}/${year}`;
    }
    return `${day}/${month}`;
  }

  function titleDay(iso) {
    const date = fromIso(iso);
    return `${date.getDate()} DE ${MONTHS[date.getMonth()].toUpperCase()} DE ${date.getFullYear()}`;
  }

  function titleMonth(iso) {
    const date = fromIso(iso);
    return `${MONTHS[date.getMonth()].toUpperCase()} DE ${date.getFullYear()}`;
  }

  function titleRange(start, end) {
    const a = fromIso(start);
    const b = fromIso(end);
    if (start === end) return titleDay(start);
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
      return `${a.getDate()} A ${b.getDate()} DE ${MONTHS[a.getMonth()].toUpperCase()} DE ${a.getFullYear()}`;
    }
    if (a.getFullYear() === b.getFullYear()) {
      return `${a.getDate()} DE ${MONTHS[a.getMonth()].toUpperCase()} A ${b.getDate()} DE ${MONTHS[b.getMonth()].toUpperCase()} DE ${a.getFullYear()}`;
    }
    return `${labelBR(start)} A ${labelBR(end)}`;
  }

  function titlePeriod() {
    if (mode === "day") return titleDay(selected);
    if (mode === "week") {
      const start = startOfWeek(selected);
      return titleRange(start, addDays(start, 6));
    }
    if (mode === "month") return titleMonth(selected);
    return titleRange(rangeStart, rangeEnd);
  }

  function esc(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function money(value) {
    return window.formatMoney(value);
  }

  function allAppointments() {
    return window.StudioState.list();
  }

  function serviceLines(appt) {
    if (Array.isArray(appt.servicos) && appt.servicos.length) return appt.servicos;
    return [
      {
        servicoId: "",
        nome: appt.service || "Serviço a definir",
        profissional: appt.professional || "",
        valorReferencia: appt.valor || 0
      }
    ];
  }

  function flatten(appts) {
    const rows = [];
    appts.forEach((appt) => {
      const live = window.StudioState.client(appt.clientId);
      const clientName = live ? live.name : appt.client;
      const api = window.StudioAvailability;
      const timeline = api && typeof api.serviceTimeline === "function" ? api.serviceTimeline(appt) : [];
      serviceLines(appt).forEach((line, index) => {
        const slot = timeline[index] || null;
        rows.push({
          apptId: appt.id,
          date: appt.date,
          time: slot && slot.inicio ? slot.inicio : appt.time || "",
          timeEnd: slot && slot.fim ? slot.fim : "",
          duration: slot ? slot.duracaoMinutos : "",
          clientId: appt.clientId,
          clientName,
          servicoId: line.servicoId || "",
          servicoNome: line.nome || "Serviço a definir",
          profissional: line.profissional || "",
          valor: line.valorReferencia || 0,
          status: appt.status
        });
      });
    });
    return rows.sort((a, b) => (a.date + a.time + a.servicoNome).localeCompare(b.date + b.time + b.servicoNome));
  }

  function serviceCatalog(row) {
    return (
      window.StudioData.serviceById(row.servicoId) ||
      window.StudioData.serviceByName(row.servicoNome) ||
      null
    );
  }

  function rowServiceId(row) {
    const catalog = serviceCatalog(row);
    return catalog?.id || row.servicoId || "";
  }

  function matchesFilters(row) {
    if (filters.profissionais.length && !filters.profissionais.includes(row.profissional)) return false;
    if (filters.clienteIds.length && !filters.clienteIds.map(String).includes(String(row.clientId))) return false;
    if (filters.statuses.length && !filters.statuses.includes(row.status)) return false;
    if (filters.servicoIds.length) {
      const id = rowServiceId(row);
      const hit =
        filters.servicoIds.includes(id) ||
        filters.servicoIds.includes(row.servicoId);
      if (!hit) return false;
    }
    return true;
  }

  function inCurrentRange(appt) {
    if (mode === "day") return appt.date === selected;
    if (mode === "week") {
      const start = startOfWeek(selected);
      const end = addDays(start, 6);
      return appt.date >= start && appt.date <= end;
    }
    if (mode === "month") return appt.date.slice(0, 7) === selected.slice(0, 7);
    return appt.date >= rangeStart && appt.date <= rangeEnd;
  }

  function filteredRows() {
    return flatten(allAppointments().filter(inCurrentRange)).filter(matchesFilters);
  }

  function hasActiveFilters() {
    return Boolean(
      filters.profissionais.length ||
        filters.clienteIds.length ||
        filters.servicoIds.length ||
        filters.statuses.length
    );
  }

  function statusMark(status) {
    return `<span class="agenda-status agenda-status--${status}"><span class="agenda-dot" aria-hidden="true"></span>${window.statusLabel(status)}</span>`;
  }

  function emptyMessage() {
    const extra = hasActiveFilters()
      ? `<p class="hint">Experimente limpar os filtros.</p>
         <button class="btn btn--secondary" type="button" data-clear-filters>Limpar filtros</button>`
      : "";
    return `
      <div class="agenda-empty">
        <p>Nenhum agendamento encontrado.</p>
        <p class="hint">Não há atendimentos para os filtros selecionados.</p>
        ${extra}
      </div>
    `;
  }

  function table(rows, showDate) {
    if (!rows.length) return emptyMessage();
    const visible = window.StudioTables ? window.StudioTables.sortRows(rows, columnSort, SORT_GETTERS) : rows;
    const th = (label, key) =>
      window.StudioTables ? window.StudioTables.header(label, key, columnSort) : `<th>${label}</th>`;
    const dateCol = showDate ? th("Data", "date") : "";
    const body = visible
      .map((row) => {
        const dateCell = showDate ? `<td>${shortLabel(row.date)}</td>` : "";
        return `
          <tr class="agenda-row" data-appt="${esc(row.apptId)}">
            ${dateCell}
            <td class="agenda-time">${esc(row.time)}${row.timeEnd ? `–${esc(row.timeEnd)}` : ""}</td>
            <td>
              <a class="appt-name" href="clientes.html?cliente=${encodeURIComponent(row.clientId)}">${esc(row.clientName)}</a>
            </td>
            <td>${esc(row.servicoNome)}</td>
            <td>${esc(row.profissional || "—")}</td>
            <td class="agenda-valor">${money(row.valor)}</td>
            <td>${statusMark(row.status)}</td>
          </tr>
        `;
      })
      .join("");
    return `
      <div class="agenda-table-wrap">
        <table class="agenda-table">
          <thead>
            <tr>
              ${dateCol}
              ${th("Horário", "time")}
              ${th("Cliente", "client")}
              ${th("Serviço", "service")}
              ${th("Profissional", "pro")}
              ${th("Valor", "value")}
              ${th("Status", "status")}
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  function countLabel(total) {
    const noun = total === 1 ? "agendamento encontrado" : "agendamentos encontrados";
    return `${total} ${noun}`;
  }

  function seedRangeFromMode(fromMode) {
    if (fromMode === "week") {
      rangeStart = startOfWeek(selected);
      rangeEnd = addDays(rangeStart, 6);
      return;
    }
    if (fromMode === "month") {
      rangeStart = monthStart(selected);
      rangeEnd = monthEnd(selected);
      return;
    }
    rangeStart = monthStart(selected);
    rangeEnd = selected;
  }

  function applyRange() {
    const start = document.getElementById("range-start")?.value;
    const end = document.getElementById("range-end")?.value;
    const error = document.getElementById("range-error");
    if (!start || !end) {
      if (error) error.hidden = false;
      return false;
    }
    if (error) error.hidden = true;
    if (start <= end) {
      rangeStart = start;
      rangeEnd = end;
    } else {
      rangeStart = end;
      rangeEnd = start;
    }
    return true;
  }

  function openPicker(input) {
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch (error) {
        /* native picker can fail if the input is not yet focused */
      }
    }
    input.focus();
  }

  function syncNav() {
    const standard = document.getElementById("agenda-nav-standard");
    const rangeBar = document.getElementById("agenda-range-bar");
    const error = document.getElementById("range-error");
    const isRange = mode === "range";
    if (standard) standard.hidden = isRange;
    if (rangeBar) rangeBar.hidden = !isRange;
    if (error && !isRange) error.hidden = true;

    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === mode);
    });

    if (isRange) {
      const start = document.getElementById("range-start");
      const end = document.getElementById("range-end");
      if (start) start.value = rangeStart;
      if (end) end.value = rangeEnd;
      return;
    }

    const prev = document.getElementById("agenda-prev");
    const current = document.getElementById("agenda-current");
    const next = document.getElementById("agenda-next");
    const pickLabel = document.getElementById("agenda-pick-label");
    const dateWrap = document.getElementById("agenda-pick-wrap");
    const monthWrap = document.getElementById("agenda-month-wrap");
    const dateInput = document.getElementById("agenda-date");
    const monthInput = document.getElementById("agenda-month");

    if (mode === "week") {
      if (prev) prev.textContent = "Semana anterior";
      if (current) current.textContent = "Semana atual";
      if (next) next.textContent = "Próxima semana";
      if (pickLabel) pickLabel.textContent = "Escolher semana";
      if (dateWrap) dateWrap.hidden = false;
      if (monthWrap) monthWrap.hidden = true;
    } else if (mode === "month") {
      if (prev) prev.textContent = "Mês anterior";
      if (current) current.textContent = "Mês atual";
      if (next) next.textContent = "Próximo mês";
      if (dateWrap) dateWrap.hidden = true;
      if (monthWrap) monthWrap.hidden = false;
    } else {
      if (prev) prev.textContent = "Ontem";
      if (current) current.textContent = "Hoje";
      if (next) next.textContent = "Amanhã";
      if (pickLabel) pickLabel.textContent = "Escolher dia";
      if (dateWrap) dateWrap.hidden = false;
      if (monthWrap) monthWrap.hidden = true;
    }

    if (dateInput) {
      dateInput.value = selected;
      dateInput.setAttribute("aria-label", pickLabel ? pickLabel.textContent : "Escolher data");
    }
    if (monthInput) monthInput.value = selected.slice(0, 7);
  }

  function professionalOptions() {
    const names = new Set(PROS);
    flatten(allAppointments()).forEach((row) => {
      if (row.profissional) names.add(row.profissional);
    });
    return [...names].sort().map((name) => ({ id: name, label: name }));
  }

  function clientOptions() {
    return window.StudioState.listClients().map((item) => ({ id: String(item.id), label: item.name }));
  }

  function statusOptions() {
    return Object.entries(window.STATUS_LABEL).map(([id, label]) => ({ id, label }));
  }

  function servicesByCategory() {
    const catalog = window.StudioData.services || [];
    const groups = {};
    CATEGORY_ORDER.forEach((cat) => {
      groups[cat] = [];
    });
    catalog.forEach((item) => {
      const cat = item.categoria || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ id: item.id, label: item.nome || item.name });
    });
    const seen = new Set(catalog.map((item) => item.id));
    flatten(allAppointments()).forEach((row) => {
      const match = serviceCatalog(row);
      const id = match?.id || row.servicoId;
      if (!id || seen.has(id)) return;
      seen.add(id);
      const cat = match?.categoria || "Histórico";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ id, label: match?.nome || match?.name || row.servicoNome });
    });
    return groups;
  }

  let openKey = "";
  const draft = {
    profissional: [],
    cliente: [],
    servico: [],
    status: []
  };

  function selectedIds(key) {
    if (key === "profissional") return filters.profissionais;
    if (key === "cliente") return filters.clienteIds;
    if (key === "servico") return filters.servicoIds;
    return filters.statuses;
  }

  function setSelectedIds(key, ids) {
    if (key === "profissional") filters.profissionais = ids;
    else if (key === "cliente") filters.clienteIds = ids;
    else if (key === "servico") filters.servicoIds = ids;
    else filters.statuses = ids;
  }

  function workingIds(key) {
    return openKey === key ? draft[key] : selectedIds(key);
  }

  function summaryFor(key) {
    const conf = MS[key];
    const ids = selectedIds(key);
    if (!ids.length) return conf.empty;
    const labels = optionLabels(key);
    if (ids.length === 1) return labels[ids[0]] || ids[0];
    const n = ids.length;
    if (conf.feminine) return n + " selecionadas";
    return n + " selecionados";
  }

  function optionLabels(key) {
    const map = {};
    if (key === "servico") {
      Object.values(servicesByCategory())
        .flat()
        .forEach((item) => {
          map[item.id] = item.label;
        });
      return map;
    }
    const list =
      key === "profissional" ? professionalOptions() : key === "cliente" ? clientOptions() : statusOptions();
    list.forEach((item) => {
      map[item.id] = item.label;
    });
    return map;
  }

  function checkboxRow(id, label, checked) {
    return `
      <label class="ms-option">
        <input type="checkbox" value="${esc(id)}" ${checked ? "checked" : ""}>
        <span>${esc(label)}</span>
      </label>
    `;
  }

  function listHtml(key, query) {
    const q = String(query || "").trim().toLowerCase();
    const selected = new Set(workingIds(key));
    const allChecked = !selected.size;
    let body = checkboxRow("__all__", MS[key].empty, allChecked);

    if (key === "servico") {
      const groups = servicesByCategory();
      Object.keys(groups).forEach((cat) => {
        const items = groups[cat].filter((item) => !q || item.label.toLowerCase().includes(q));
        if (!items.length) return;
        const ids = groups[cat].map((item) => item.id);
        const catAll = ids.length && ids.every((id) => selected.has(id));
        body += `<p class="ms-cat">${esc(cat.toUpperCase())}</p>`;
        if (!q) body += checkboxRow("__cat__:" + cat, "Todos de " + cat, catAll);
        body += items.map((item) => checkboxRow(item.id, item.label, selected.has(item.id))).join("");
      });
      return body;
    }

    const list =
      key === "profissional" ? professionalOptions() : key === "cliente" ? clientOptions() : statusOptions();
    const filtered = list.filter((item) => !q || item.label.toLowerCase().includes(q));
    if (!filtered.length) body += `<p class="ms-empty">Nenhuma opção encontrada.</p>`;
    body += filtered.map((item) => checkboxRow(item.id, item.label, selected.has(item.id))).join("");
    return body;
  }

  function fillPanel(key) {
    const rootMs = document.querySelector('[data-ms="' + key + '"]');
    const list = rootMs && rootMs.querySelector(".ms-list");
    const search = rootMs && rootMs.querySelector(".ms-search");
    if (!list) return;
    list.innerHTML = listHtml(key, search ? search.value : "");
  }

  function syncSummaries() {
    document.querySelectorAll("[data-ms]").forEach((el) => {
      const summary = el.querySelector(".ms-summary");
      if (summary) summary.textContent = summaryFor(el.dataset.ms);
    });
  }

  function closePanels() {
    openKey = "";
    document.querySelectorAll(".ms-panel").forEach((panel) => {
      panel.hidden = true;
    });
    document.querySelectorAll(".ms-trigger").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function openPanel(key) {
    closePanels();
    openKey = key;
    draft[key] = selectedIds(key).slice();
    const rootMs = document.querySelector('[data-ms="' + key + '"]');
    if (!rootMs) return;
    const search = rootMs.querySelector(".ms-search");
    if (search) search.value = "";
    fillPanel(key);
    const panel = rootMs.querySelector(".ms-panel");
    const trigger = rootMs.querySelector(".ms-trigger");
    if (panel) panel.hidden = false;
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    if (search) search.focus();
  }

  function applyPanel(key) {
    setSelectedIds(key, (draft[key] || []).slice());
    closePanels();
    render();
  }

  function onCheck(key, input) {
    if (input.value === "__all__") {
      draft[key] = [];
      fillPanel(key);
      return;
    }
    const current = new Set(draft[key]);
    if (input.value.startsWith("__cat__:")) {
      const cat = input.value.slice(8);
      (servicesByCategory()[cat] || []).forEach((item) => {
        if (input.checked) current.add(item.id);
        else current.delete(item.id);
      });
    } else if (input.checked) current.add(input.value);
    else current.delete(input.value);
    draft[key] = [...current];
    fillPanel(key);
  }

  function buildMultiSelects() {
    document.querySelectorAll("[data-ms]").forEach((el) => {
      const key = el.dataset.ms;
      const conf = MS[key];
      el.innerHTML = `
        <span class="ms-kicker">${conf.title}</span>
        <button class="ms-trigger" type="button" aria-haspopup="true" aria-expanded="false">
          <span class="ms-summary">${conf.empty}</span>
          <span class="ms-caret" aria-hidden="true">▾</span>
        </button>
        <div class="ms-panel" hidden>
          <p class="ms-title">${conf.title}</p>
          ${
            conf.search
              ? `<input class="ms-search input" type="search" placeholder="Buscar ${conf.title.toLowerCase()}...">`
              : ""
          }
          <div class="ms-list"></div>
          <button class="btn btn--primary ms-apply" type="button">Aplicar</button>
        </div>
      `;
    });
  }

  function render() {
    syncNav();
    syncSummaries();
    const rows = filteredRows();
    root.innerHTML = `
      <section class="agenda-board">
        <div class="agenda-board-head">
          <h2 class="section-title">${titlePeriod()}</h2>
          <p class="agenda-count">${countLabel(rows.length)}</p>
        </div>
        ${table(rows, mode !== "day")}
      </section>
    `;
  }

  function clearFilters() {
    filters.profissionais = [];
    filters.clienteIds = [];
    filters.servicoIds = [];
    filters.statuses = [];
    closePanels();
    render();
  }

  function shiftDate(amount) {
    if (mode === "week") selected = addDays(selected, amount * 7);
    else if (mode === "month") selected = addMonths(selected, amount);
    else selected = addDays(selected, amount);
    render();
  }

  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.mode;
      if (next === "range") {
        if (mode !== "range") lastMode = mode;
        seedRangeFromMode(lastMode);
      } else {
        lastMode = next;
      }
      mode = next;
      render();
    });
  });

  document.getElementById("agenda-current")?.addEventListener("click", () => {
    selected = todayIso();
    render();
  });

  document.getElementById("agenda-prev")?.addEventListener("click", () => shiftDate(-1));
  document.getElementById("agenda-next")?.addEventListener("click", () => shiftDate(1));

  document.getElementById("agenda-date")?.addEventListener("change", (event) => {
    if (!event.target.value) return;
    selected = event.target.value;
    render();
  });

  document.getElementById("agenda-month")?.addEventListener("change", (event) => {
    if (!event.target.value) return;
    const day = Number(selected.slice(8));
    const [year, month] = event.target.value.split("-").map(Number);
    const last = new Date(year, month, 0).getDate();
    selected = `${event.target.value}-${String(Math.min(day || 1, last)).padStart(2, "0")}`;
    render();
  });

  document.getElementById("agenda-pick-wrap")?.addEventListener("click", () => {
    openPicker(document.getElementById("agenda-date"));
  });

  document.getElementById("agenda-month-wrap")?.addEventListener("click", () => {
    openPicker(document.getElementById("agenda-month"));
  });

  document.getElementById("range-apply")?.addEventListener("click", () => {
    if (applyRange()) render();
  });

  document.getElementById("range-clear")?.addEventListener("click", () => {
    mode = lastMode || "day";
    document.getElementById("range-error").hidden = true;
    render();
  });

  const filtersRoot = document.getElementById("agenda-filters");
  buildMultiSelects();

  filtersRoot?.addEventListener("click", (event) => {
    const apply = event.target.closest(".ms-apply");
    if (apply) {
      event.preventDefault();
      applyPanel(apply.closest("[data-ms]").dataset.ms);
      return;
    }
    const trigger = event.target.closest(".ms-trigger");
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    const key = trigger.closest("[data-ms]").dataset.ms;
    const panel = trigger.parentElement.querySelector(".ms-panel");
    if (panel && !panel.hidden) closePanels();
    else openPanel(key);
  });

  filtersRoot?.addEventListener("change", (event) => {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input) return;
    onCheck(input.closest("[data-ms]").dataset.ms, input);
  });

  filtersRoot?.addEventListener("input", (event) => {
    const search = event.target.closest(".ms-search");
    if (!search) return;
    fillPanel(search.closest("[data-ms]").dataset.ms);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".ms")) closePanels();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanels();
  });

  document.getElementById("agenda-clear")?.addEventListener("click", clearFilters);

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-clear-filters]")) clearFilters();
  });

  window.agendaShowDate = function (date) {
    selected = date;
    mode = "day";
    lastMode = "day";
    render();
  };

  document.addEventListener("appointments:changed", render);
  document.addEventListener("clients:changed", render);
  if (window.StudioTables) {
    window.StudioTables.bind(root, (key) => {
      columnSort = window.StudioTables.nextState(columnSort, key);
      render();
    });
  }
  render();
})();
