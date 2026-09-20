(function () {
  function cmpText(a, b) {
    return String(a || "").localeCompare(String(b || ""), "pt-BR", { sensitivity: "base", numeric: true });
  }

  function cmpDate(a, b) {
    const left = String(a || "");
    const right = String(b || "");
    if (!left && !right) return 0;
    if (!left) return 1;
    if (!right) return -1;
    return left.localeCompare(right);
  }

  function cmpNumber(a, b) {
    return (Number(a) || 0) - (Number(b) || 0);
  }

  function cmpStatus(a, b, rank) {
    const left = rank && rank[a] != null ? rank[a] : 99;
    const right = rank && rank[b] != null ? rank[b] : 99;
    if (left !== right) return left - right;
    return cmpText(a, b);
  }

  function compare(type, a, b, rank) {
    if (type === "number") return cmpNumber(a, b);
    if (type === "date") return cmpDate(a, b);
    if (type === "status") return cmpStatus(a, b, rank);
    return cmpText(a, b);
  }

  function nextState(current, key) {
    if (!current || current.key !== key) return { key, dir: "asc" };
    if (current.dir === "asc") return { key, dir: "desc" };
    return null;
  }

  function sortRows(rows, state, getters) {
    const list = Array.isArray(rows) ? rows.slice() : [];
    if (!state || !state.key || !getters || !getters[state.key]) return list;
    const spec = getters[state.key];
    const dir = state.dir === "desc" ? -1 : 1;
    return list.sort((a, b) => {
      const result = compare(spec.type, spec.value(a), spec.value(b), spec.rank);
      return result * dir;
    });
  }

  function header(label, key, state) {
    const active = Boolean(state && state.key === key);
    const dir = active ? state.dir : "";
    const mark = dir === "asc" ? "↑" : dir === "desc" ? "↓" : "↕";
    const aria = dir === "asc" ? "crescente" : dir === "desc" ? "decrescente" : "ordenar";
    return `<th class="th-sortable" data-sort="${key}">
      <button class="th-sort" type="button" data-sort="${key}" aria-label="Ordenar por ${label}, ${aria}">
        <span>${label}</span>
        <span class="th-sort-mark" aria-hidden="true">${mark}</span>
      </button>
    </th>`;
  }

  function bind(host, onSort) {
    if (!host || host.dataset.sortBound === "1") return;
    host.dataset.sortBound = "1";
    host.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-sort]");
      if (!trigger || !host.contains(trigger)) return;
      event.preventDefault();
      event.stopPropagation();
      onSort(trigger.getAttribute("data-sort"));
    });
  }

  window.StudioTables = {
    nextState,
    sortRows,
    header,
    bind
  };
})();
