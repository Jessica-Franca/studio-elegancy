(function () {
  const CATEGORIES_FALLBACK = ["Unhas", "Cílios", "Sobrancelhas"];

  function catalogCategories() {
    if (window.StudioState && typeof window.StudioState.listCategories === "function") {
      return window.StudioState.listCategories();
    }
    return (window.StudioState && window.StudioState.CATEGORIES) || CATEGORIES_FALLBACK;
  }
  const MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];

  const COMPOSER_HTML = `
      <div class="modal-backdrop" id="modal-new">
        <section class="composer" role="dialog" aria-labelledby="new-title">
          <div class="composer-top">
            <div>
              <span class="brand-heart">♡</span>
              <h2 class="modal-title" id="new-title">Novo agendamento</h2>
              <p class="page-subtitle" id="new-subtitle">Organize o próximo momento de cuidado da sua cliente.</p>
            </div>
            <button class="composer-close" type="button" data-close-new aria-label="Fechar">×</button>
          </div>
          <div class="composer-grid">
            <form class="composer-form" id="new-form">
              <div class="field" id="field-client">
                <label>Cliente</label>
                <div class="client-combo picker" id="client-picker">
                  <button class="picker-trigger" type="button" id="client-trigger">
                    <svg class="picker-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="11" cy="11" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"></circle>
                      <path d="M16 16l4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
                    </svg>
                    <span class="picker-placeholder" id="client-label">Buscar cliente...</span>
                    <span class="picker-check" id="client-check" hidden>✓</span>
                  </button>
                  <button class="picker-add" id="new-client-quick" type="button" aria-label="Cadastrar nova cliente">+</button>
                  <div class="picker-panel">
                    <input class="input" id="client-search-new" type="search" placeholder="Buscar por nome, telefone ou documento..." autocomplete="off">
                    <div id="client-options" style="margin-top:8px"></div>
                  </div>
                </div>
                <input type="hidden" name="clientId" id="new-client-id">
                <span class="field-error">Selecione a cliente para continuar.</span>
              </div>

              <div class="when-row">
                <div class="field" id="field-date">
                  <label for="new-date">Data</label>
                  <input class="input" id="new-date" name="date" type="text" placeholder="dd/mm/aaaa">
                  <span class="field-error">Informe a data do atendimento.</span>
                </div>
                <div class="field" id="field-time">
                  <label for="new-time">Horário</label>
                  <input class="input" id="new-time" name="time" type="text" value="14:30" placeholder="14:30" list="time-options">
                  <datalist id="time-options"></datalist>
                  <p class="hint" id="time-occupancy"></p>
                  <div class="time-suggest" id="time-suggest"></div>
                  <span class="field-error" id="err-time">Informe o horário do atendimento.</span>
                </div>
              </div>

              <div class="field" id="field-services">
                <label>Serviços</label>
                <div class="svc-list" id="svc-list"></div>
                <button class="btn-add-svc" id="btn-add-svc" type="button">+ Adicionar serviço</button>
                <span class="field-error" id="err-services">Adicione pelo menos um serviço.</span>
              </div>

              <div class="when-row">
                <div class="field" id="field-extra">
                  <label for="new-extra">Valor extra (opcional)</label>
                  <input class="input" id="new-extra" name="valorExtra" type="text" inputmode="decimal" lang="pt-BR" autocomplete="off" placeholder="0,00">
                  <span class="field-error">O valor extra não pode ser negativo.</span>
                </div>
                <div class="field">
                  <label for="new-extra-reason">Motivo do valor extra</label>
                  <input class="input" id="new-extra-reason" name="motivoValorExtra" placeholder="Decoração adicional solicitada pela cliente">
                </div>
              </div>

              <div class="field" id="field-pay">
                <label for="new-pay">Forma de pagamento</label>
                <select class="select" id="new-pay" name="formaPagamento">
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                </select>
              </div>

              <div class="totals-box" id="totals-box"></div>

              <div class="field">
                <label for="new-status">Status</label>
                <select class="select" id="new-status" name="status">
                  <option value="agendado">Agendado</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div class="field">
                <label for="new-notes">Observações</label>
                <textarea class="textarea composer-notes" id="new-notes" name="notes" placeholder="Preferências, retorno, recados da cliente..."></textarea>
              </div>

              <div class="composer-actions">
                <button class="btn btn--secondary" type="button" data-close-new>Cancelar</button>
                <button class="btn btn--primary" type="submit" id="new-submit">Agendar atendimento</button>
              </div>
            </form>
            <aside class="composer-summary">
              <span class="kicker">Resumo</span>
              <div id="new-summary" style="margin-top:14px"></div>
            </aside>
          </div>
        </section>
      </div>
      <div class="modal-backdrop modal-backdrop--over" id="modal-svc-picker">
        <section class="svc-sheet" role="dialog" aria-labelledby="svc-picker-title">
          <div class="composer-top" style="padding:0 0 12px">
            <div>
              <span class="kicker">Catálogo</span>
              <h2 class="modal-title" id="svc-picker-title">Adicionar serviço</h2>
              <p class="page-subtitle">Escolha um ou mais serviços. O mesmo serviço não pode ser repetido.</p>
            </div>
            <button class="composer-close" type="button" data-close-svc-picker aria-label="Fechar">×</button>
          </div>
          <div class="field">
            <label for="svc-search">Buscar</label>
            <input class="input" id="svc-search" type="search" placeholder="Buscar pelo nome do serviço..." autocomplete="off">
          </div>
          <div class="segments svc-cats" id="svc-cats"></div>
          <div id="svc-picker-list" class="svc-picker-list"></div>
        </section>
      </div>
  `;

  function ensureComposer() {
    const existing = document.getElementById("modal-new");
    if (existing && (!document.getElementById("svc-list") || !document.getElementById("new-pay"))) {
      existing.remove();
    }
    if (!document.getElementById("modal-new")) {
      document.body.insertAdjacentHTML("beforeend", COMPOSER_HTML);
    }
  }

  ensureComposer();

  const modal = document.getElementById("modal-new");
  const form = document.getElementById("new-form");
  const pickerModal = document.getElementById("modal-svc-picker");
  if (!modal || !form) return;

  const picker = document.getElementById("client-picker");
  const trigger = document.getElementById("client-trigger");
  const label = document.getElementById("client-label");
  const check = document.getElementById("client-check");
  const search = document.getElementById("client-search-new");
  const options = document.getElementById("client-options");
  const clientId = document.getElementById("new-client-id");
  const dateInput = document.getElementById("new-date");
  if (window.enhanceDateField) window.enhanceDateField(dateInput);
  const timeInput = document.getElementById("new-time");
  const extraInput = document.getElementById("new-extra");
  const extraReason = document.getElementById("new-extra-reason");
  const payInput = document.getElementById("new-pay");
  const status = document.getElementById("new-status");
  const notes = document.getElementById("new-notes");
  const summary = document.getElementById("new-summary");
  const svcList = document.getElementById("svc-list");
  const totalsBox = document.getElementById("totals-box");
  const svcSearch = document.getElementById("svc-search");
  const svcCats = document.getElementById("svc-cats");
  const svcPickerList = document.getElementById("svc-picker-list");
  const timeOccupancy = document.getElementById("time-occupancy");
  const timeSuggest = document.getElementById("time-suggest");
  const timeOptions = document.getElementById("time-options");
  const timeError = document.getElementById("err-time");

  let lines = [];
  let editingId = null;
  let composerOrigin = "";
  let composerMaintId = "";
  let pickerCategory = "all";
  let bound = false;

  function parseDate(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const match = String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    return "";
  }

  function longDate(iso) {
    if (!iso) return "—";
    const [year, month, day] = iso.split("-").map(Number);
    return `${day} de ${MONTHS[month - 1]}`;
  }

  function shortDate(iso) {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}`;
  }

  function labelDate(iso) {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  }

  function fold(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function money(value) {
    return window.formatarMoedaBR(value);
  }

  function priceLabel(line) {
    const text = money(line.valorReferencia);
    const prefix = line.fromPrice ? "A partir de " : "";
    const suffix = line.unidadePreco === "por unha" ? " por unha" : "";
    return prefix + text + suffix;
  }

  function paymentOf() {
    const value = payInput ? payInput.value : "pix";
    return value === "dinheiro" || value === "cartao" ? value : "pix";
  }

  function applyLinePrice(line) {
    const catalog = catalogOf(line.servicoId);
    if (!catalog) return line;
    line.valorReferencia = window.StudioState.priceForService
      ? window.StudioState.priceForService(catalog.id, line.modalidade, paymentOf())
      : catalog.valorReferencia;
    line.fromPrice = isFromPrice(catalog);
    line.unidadePreco = catalog.unidadePreco || "";
    return line;
  }

  function catalogOf(id) {
    if (window.StudioState && typeof window.StudioState.service === "function") {
      const live = window.StudioState.service(id);
      if (live) return live;
    }
    return window.StudioData.serviceById(id) || window.StudioData.serviceByName(id);
  }

  function liveServices() {
    if (window.StudioState && typeof window.StudioState.listServices === "function") {
      return window.StudioState.listServices();
    }
    return window.StudioData.services || [];
  }

  function bookableServices() {
    return liveServices().filter((item) => item.ativo !== false && item.legadoManutencaoSolta !== true);
  }

  function enabledPros(servicoId) {
    const catalog = catalogOf(servicoId);
    return catalog && Array.isArray(catalog.profissionaisHabilitadas)
      ? catalog.profissionaisHabilitadas.slice()
      : [];
  }

  function isFromPrice(item) {
    return Boolean(item && (item.fromPrice || item.tipoPreco === "a_partir_de"));
  }

  function selectedClient() {
    return window.StudioState.client(clientId.value);
  }

  function extraAmount() {
    const bruto = extraInput.value;
    if (!String(bruto || "").trim()) return { ok: true, value: 0 };
    const value = window.parseMoedaBR(bruto);
    if (!Number.isFinite(value) || value < 0) return { ok: false, value: 0 };
    return { ok: true, value };
  }

  function totals() {
    const extra = extraAmount();
    const subtotal = lines.reduce((sum, line) => sum + (line.valorReferencia || 0), 0);
    return {
      subtotal,
      extra: extra.ok ? extra.value : 0,
      extraOk: extra.ok,
      total: subtotal + (extra.ok ? extra.value : 0)
    };
  }

  function avail() {
    return window.StudioAvailability || null;
  }

  function draftAppointment() {
    return {
      id: editingId || "draft",
      date: parseDate(dateInput.value),
      time: String(timeInput.value || "").trim(),
      status: status.value || "agendado",
      servicos: lines
    };
  }

  function durationLabel(minutes) {
    const n = Number(minutes) || 0;
    return n + " min";
  }

  function occupancyMarkup() {
    const api = avail();
    if (!api || !lines.length) return "";
    const draft = draftAppointment();
    const blocks = api.getProfessionalOccupancy(draft);
    if (!blocks.length) return "";
    const end = api.calculateAppointmentEnd(draft);
    const rows = blocks
      .map(
        (item) =>
          `${item.profissional}: ${api.minutesToTime(item.start)} → ${api.minutesToTime(item.end)} · ${durationLabel(item.duracaoMinutos)}`
      )
      .join("<br>");
    return `${rows}${end ? `<br>Término previsto: ${end}` : ""}`;
  }

  function refreshAvailability() {
    const api = avail();
    const iso = parseDate(dateInput.value);
    const ready = Boolean(api && iso && lines.length && lines.every((line) => line.profissional));
    if (timeOccupancy) timeOccupancy.innerHTML = occupancyMarkup();
    if (!ready) {
      if (timeSuggest) timeSuggest.innerHTML = "";
      if (timeOptions) timeOptions.innerHTML = "";
      return;
    }
    const times = api.getAvailableTimes(iso, lines, { excludeId: editingId || "" });
    if (timeOptions) {
      timeOptions.innerHTML = times.map((time) => `<option value="${time}"></option>`).join("");
    }
    if (timeSuggest) {
      const shown = times.slice(0, 12);
      timeSuggest.innerHTML = shown
        .map((time) => `<button class="time-chip" type="button" data-time-chip="${time}">${time}</button>`)
        .join("");
    }
    const typed = String(timeInput.value || "").trim();
    if (!typed) return;
    if (api.timeToMinutes(typed) == null) {
      markInvalid("field-time");
      if (timeError) timeError.textContent = "Informe um horário válido, por exemplo 14:30.";
      return;
    }
    const hit = api.hasAppointmentConflict(draftAppointment(), editingId || "draft");
    if (hit) {
      markInvalid("field-time");
      if (timeError) timeError.textContent = hit.message || "Este horário não está disponível para a profissional.";
    } else {
      document.getElementById("field-time")?.classList.remove("is-invalid");
    }
  }

  function phoneLine(item) {
    return item.phone ? item.phone : "Telefone não informado";
  }

  function typedName() {
    return (search.value || "").trim();
  }

  function openNewClient() {
    picker.classList.remove("is-open", "is-invalid");
    window.openClientForm({
      source: "appointment",
      initialName: typedName(),
      onSaved(client) {
        selectClient(client);
      }
    });
  }

  function shortcutMarkup() {
    const term = typedName();
    const labelText = term ? `+ Cadastrar “${term}”` : "+ Cadastrar nova cliente";
    return `<button class="picker-shortcut" type="button" data-new-client-shortcut>${labelText}</button>`;
  }

  function renderClients() {
    const term = typedName().toLowerCase();
    const items = window.StudioState.listClients().filter((item) =>
      `${item.name} ${item.phone} ${item.whatsapp} ${item.documento} ${item.email}`
        .toLowerCase()
        .includes(term)
    );
    const list = items.length
      ? items
          .map(
            (item) => `
        <button class="picker-option ${item.id === clientId.value ? "is-active" : ""}" type="button" data-client-option="${item.id}">
          <span class="initials">${item.initials}</span>
          <span>
            <strong>${item.name}</strong>
            ${window.clientStatusMarkup(item)}
            <span class="client-meta" style="display:block">${phoneLine(item)}</span>
          </span>
        </button>
      `
          )
          .join("")
      : `<p class="empty">Nenhuma cliente encontrada.</p>`;
    options.innerHTML = `${list}${shortcutMarkup()}`;
  }

  function showClient(client) {
    trigger.querySelector(".initials")?.remove();
    if (!client) {
      label.className = "picker-placeholder";
      label.textContent = "Buscar cliente...";
      if (check) check.hidden = true;
      picker.classList.remove("has-client");
      return;
    }
    label.className = "picker-name";
    label.textContent = client.name;
    if (check) check.hidden = false;
    picker.classList.add("has-client");
    trigger.insertAdjacentHTML("afterbegin", `<span class="initials">${client.initials}</span>`);
  }

  function selectClient(client) {
    if (!client) return;
    clientId.value = client.id;
    showClient(client);
    picker.classList.remove("is-open", "is-invalid");
    document.getElementById("field-client").classList.remove("is-invalid");
    search.value = "";
    renderClients();
    renderSummary();
  }

  function renderLines() {
    lines.forEach((line) => {
      const pros = enabledPros(line.servicoId);
      if (line.profissional && !pros.includes(line.profissional)) line.profissional = "";
      if (pros.length === 1) line.profissional = pros[0];
    });
    if (!lines.length) {
      svcList.innerHTML = `<p class="svc-empty">Nenhum serviço adicionado. Toque em “Adicionar serviço”.</p>`;
      renderTotals();
      renderSummary();
      refreshAvailability();
      return;
    }
    svcList.innerHTML = lines
      .map((line, index) => {
        const pros = enabledPros(line.servicoId);
        let proField = "";
        if (!pros.length) {
          proField = `<p class="svc-warning">Este serviço ainda não possui uma profissional habilitada.<br>Edite o serviço para configurar quem pode realizá-lo.</p>`;
        } else if (pros.length === 1) {
          proField = `
            <label class="form-label">Profissional</label>
            <p class="svc-pro-fixed">${pros[0]}</p>
          `;
        } else {
          const opts = [`<option value="">Selecione</option>`]
            .concat(
              pros.map(
                (name) =>
                  `<option value="${name}" ${line.profissional === name ? "selected" : ""}>${name}</option>`
              )
            )
            .join("");
          proField = `
            <label class="form-label" for="svc-pro-${index}">Profissional</label>
            <select class="select svc-pro" id="svc-pro-${index}" data-svc-pro="${index}">${opts}</select>
          `;
        }
        const hint = line.fromPrice ? `<span class="svc-ref">Valor de referência</span>` : "";
        const invalid = !pros.length || (pros.length > 1 && !line.profissional);
        const modalidadeField = catalogOf(line.servicoId)?.exigeManutencao
          ? `
            <label class="form-label">Modalidade</label>
            <div class="check-row svc-mod-row">
              <label class="check-pill">
                <input type="radio" name="svc-mod-${index}" value="normal" data-svc-mod="${index}" ${line.modalidade !== "manutencao" ? "checked" : ""}>
                <span>Atendimento normal</span>
              </label>
              <label class="check-pill">
                <input type="radio" name="svc-mod-${index}" value="manutencao" data-svc-mod="${index}" ${line.modalidade === "manutencao" ? "checked" : ""}>
                <span>Manutenção</span>
              </label>
            </div>
          `
          : `<p class="hint">Atendimento normal</p>`;
        return `
          <article class="svc-card ${invalid ? "is-invalid" : ""}" data-svc-index="${index}">
            <div class="svc-card-top">
              <div>
                <h3 class="svc-name">${line.nome}</h3>
                <span class="svc-cat">${line.categoria || "Serviço"} · ${durationLabel(avail() ? avail().getServiceDuration(line) : 60)}${line.modalidade === "manutencao" ? " · Manutenção" : ""}</span>
              </div>
              <div class="svc-card-side">
                <strong class="svc-price">${priceLabel(line)}</strong>
                ${hint}
                <button class="svc-remove" type="button" data-remove-svc="${index}" aria-label="Remover ${line.nome}">×</button>
              </div>
            </div>
            ${modalidadeField}
            ${proField}
            <span class="field-error">${
              !pros.length
                ? "Este serviço ainda não possui uma profissional habilitada."
                : "Escolha a profissional responsável por este serviço."
            }</span>
          </article>
        `;
      })
      .join("");
    renderTotals();
    renderSummary();
    refreshAvailability();
  }

  function renderTotals() {
    const { subtotal, extra, total } = totals();
    totalsBox.innerHTML = `
      <div class="totals-row"><span>Valor dos serviços</span><strong>${money(subtotal)}</strong></div>
      <div class="totals-row"><span>Valor extra</span><strong>${money(extra)}</strong></div>
      <div class="totals-row totals-row--total"><span>Total</span><strong>${money(total)}</strong></div>
    `;
  }

  function renderSummary() {
    const client = selectedClient();
    const { subtotal, extra, total } = totals();
    const iso = parseDate(dateInput.value);
    if (!client && !lines.length) {
      summary.innerHTML = `<p class="hint">Escolha a cliente, a data e os serviços para conferir o atendimento.</p>`;
      return;
    }
    const serviceRows = lines.length
      ? lines
          .map((line) => {
            const pro = line.profissional || "A escolher";
            return `<p class="summary-line"><span>${line.nome}${line.modalidade === "manutencao" ? " · Manutenção" : ""}<br><em>${pro}</em></span><strong>${priceLabel(line)}</strong></p>`;
          })
          .join("")
      : `<p class="hint">Nenhum serviço selecionado.</p>`;
    summary.innerHTML = `
      <p class="profile-name" style="font-size:22px">♡  ${client ? client.name : "Cliente a escolher"}</p>
      ${client ? window.clientStatusMarkup(client) : ""}
      <p class="appt-time" style="margin:12px 0 8px">${iso ? longDate(iso) : "Data a escolher"}<br>${timeInput.value || "—"}${occupancyMarkup() ? `<br><span class="hint">${occupancyMarkup()}</span>` : ""}</p>
      <div class="summary-services">${serviceRows}</div>
      <p class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></p>
      <p class="summary-line"><span>Valor extra</span><strong>${money(extra)}</strong></p>
      <p class="summary-line"><span>Pagamento</span><strong>${paymentOf() === "cartao" ? "Cartão" : paymentOf() === "dinheiro" ? "Dinheiro" : "Pix"}</strong></p>
      <p class="summary-line summary-line--total"><span>Total</span><strong>${money(total)}</strong></p>
      <p style="margin-top:12px"><span class="kicker">Status</span><br>
        <span class="${window.badgeClass(status.value)}">${window.statusLabel(status.value)}</span>
      </p>
    `;
  }

  function renderPickerCats() {
    const tabs = [{ id: "all", label: "Todos" }].concat(
      catalogCategories().map((name) => ({ id: name, label: name.toUpperCase() }))
    );
    svcCats.innerHTML = tabs
      .map(
        (tab) =>
          `<button class="segment ${pickerCategory === tab.id ? "is-active" : ""}" type="button" data-svc-cat="${tab.id}">${tab.label}</button>`
      )
      .join("");
  }

  function renderPickerList() {
    const term = fold(svcSearch.value);
    const selected = new Set(lines.map((line) => line.servicoId));
    const groups = {};
    catalogCategories().forEach((name) => {
      groups[name] = {};
    });
    bookableServices().forEach((item) => {
      if (pickerCategory !== "all" && item.categoria !== pickerCategory) return;
      if (term && !fold(`${item.nome} ${item.categoria} ${item.subgrupo || ""}`).includes(term)) return;
      const cat = item.categoria || "Outros";
      const sub = item.subgrupo || "Outros";
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][sub]) groups[cat][sub] = [];
      groups[cat][sub].push(item);
    });
    const blocks = catalogCategories().map((name) => {
      const subs = groups[name] || {};
      const keys = Object.keys(subs);
      if (!keys.length) return "";
      const order =
        window.StudioState && typeof window.StudioState.subgroupsFor === "function"
          ? window.StudioState.subgroupsFor(name)
          : keys;
      const ordered = order.filter((sub) => subs[sub] && subs[sub].length).concat(keys.filter((sub) => order.indexOf(sub) < 0));
      const sections = ordered
        .map((sub) => {
          const cards = (subs[sub] || [])
            .map((item) => {
              const taken = selected.has(item.id);
              const emptyPros = !(item.profissionaisHabilitadas || []).length;
              return `
                <button class="svc-pick ${taken ? "is-taken" : ""}" type="button" data-add-svc="${item.id}" ${taken ? "disabled" : ""}>
                  <span>
                    <strong>${item.nome}</strong>
                    <span class="svc-cat">${item.categoria}${item.subgrupo ? " · " + item.subgrupo : ""}</span>
                    ${taken ? `<span class="svc-taken">Já adicionado</span>` : ""}
                    ${emptyPros ? `<span class="svc-taken">Sem profissional habilitada</span>` : ""}
                  </span>
                  <strong class="svc-price">${item.price}</strong>
                </button>
              `;
            })
            .join("");
          return `<span class="kicker">${sub}</span>${cards}`;
        })
        .join("");
      return `<section class="svc-group"><span class="kicker">${name.toUpperCase()}</span>${sections}</section>`;
    }).join("");
    svcPickerList.innerHTML = blocks || `<p class="empty">Nenhum serviço encontrado.</p>`;
  }

  function openPicker() {
    pickerCategory = "all";
    svcSearch.value = "";
    renderPickerCats();
    renderPickerList();
    pickerModal.classList.add("is-open");
    window.setTimeout(() => svcSearch.focus(), 40);
  }

  function closePicker() {
    pickerModal.classList.remove("is-open");
  }

  function addService(id, options) {
    const opts = options || {};
    const catalog = catalogOf(id);
    if (!catalog) return;
    let modalidade = opts.modalidade === "manutencao" ? "manutencao" : "normal";
    if (modalidade === "manutencao" && catalog.exigeManutencao !== true) {
      window.toast("Este serviço não possui manutenção.");
      modalidade = "normal";
    }
    if (lines.some((line) => line.servicoId === catalog.id && line.modalidade === modalidade)) {
      window.toast("Este serviço já está no agendamento.");
      return;
    }
    if (catalog.ativo === false) {
      window.toast("Este serviço está inativo e não pode ser usado em um novo agendamento.");
      return;
    }
    const pros = enabledPros(catalog.id);
    const line = applyLinePrice({
      servicoId: catalog.id,
      nome: catalog.nome,
      categoria: catalog.categoria,
      valorReferencia: 0,
      fromPrice: isFromPrice(catalog),
      unidadePreco: catalog.unidadePreco || "",
      modalidade,
      profissional: opts.profissional && pros.includes(opts.profissional) ? opts.profissional : pros.length === 1 ? pros[0] : ""
    });
    lines.push(line);
    document.getElementById("field-services").classList.remove("is-invalid");
    renderLines();
    renderPickerList();
    if (!pros.length) {
      window.toast("Este serviço ainda não possui uma profissional habilitada.");
    }
  }

  function clearInvalid() {
    ["field-client", "field-date", "field-time", "field-services", "field-extra"].forEach((id) => {
      document.getElementById(id)?.classList.remove("is-invalid");
    });
  }

  function markInvalid(id) {
    const field = document.getElementById(id);
    if (!field) return;
    field.classList.add("is-invalid");
  }

  function resetForm() {
    form.reset();
    form.dataset.saving = "";
    lines = [];
    editingId = null;
    composerMaintId = "";
    clientId.value = "";
    dateInput.value = window.labelDate(window.StudioState.today);
    timeInput.value = "14:30";
    extraInput.value = "";
    extraReason.value = "";
    if (payInput) payInput.value = "pix";
    status.value = "agendado";
    notes.value = "";
    picker.classList.remove("is-open", "is-invalid");
    showClient(null);
    search.value = "";
    clearInvalid();
    document.getElementById("new-title").textContent = "Novo agendamento";
    document.getElementById("new-subtitle").textContent = "Organize o próximo momento de cuidado da sua cliente.";
    document.getElementById("new-submit").textContent = "Agendar atendimento";
    renderClients();
    renderLines();
    if (window.enhanceDateField) window.enhanceDateField(dateInput);
  }

  function fillFrom(appt) {
    editingId = appt.id;
    document.getElementById("new-title").textContent = "Editar agendamento";
    document.getElementById("new-subtitle").textContent = "Atualize os serviços e a profissional responsável por cada um.";
    document.getElementById("new-submit").textContent = "Salvar alterações";
    const client = window.StudioState.client(appt.clientId);
    if (client) selectClient(client);
    dateInput.value = appt.dateLabel || labelDate(appt.date);
    timeInput.value = appt.time || "";
    extraInput.value = window.textoMoedaInput(appt.valorExtra);
    extraReason.value = appt.motivoValorExtra || "";
    if (payInput) payInput.value = appt.formaPagamento || "pix";
    status.value = appt.status || "agendado";
    notes.value = appt.notes || "";
    lines = (appt.servicos || []).map((line) => ({ ...line }));
    composerMaintId = appt.manutencaoId || "";
    renderLines();
    if (window.enhanceDateField) window.enhanceDateField(dateInput);
  }

  function validate() {
    clearInvalid();
    let first = null;
    const client = selectedClient();
    if (!client) {
      markInvalid("field-client");
      picker.classList.add("is-invalid");
      first = first || "field-client";
    }
    if (!String(dateInput.value || "").trim() || !parseDate(dateInput.value)) {
      markInvalid("field-date");
      first = first || "field-date";
    }
    if (!String(timeInput.value || "").trim()) {
      markInvalid("field-time");
      if (timeError) timeError.textContent = "Informe o horário do atendimento.";
      first = first || "field-time";
    } else if (avail() && avail().timeToMinutes(timeInput.value.trim()) == null) {
      markInvalid("field-time");
      if (timeError) timeError.textContent = "Informe um horário válido, por exemplo 14:30.";
      first = first || "field-time";
    }
    if (!lines.length) {
      markInvalid("field-services");
      document.getElementById("err-services").textContent = "Adicione pelo menos um serviço.";
      first = first || "field-services";
    }
    const ids = new Set();
    lines.forEach((line) => {
      if (ids.has(line.servicoId)) {
        markInvalid("field-services");
        document.getElementById("err-services").textContent = "O mesmo serviço não pode ser adicionado duas vezes.";
        first = first || "field-services";
      }
      ids.add(line.servicoId);
      const pros = enabledPros(line.servicoId);
      if (!pros.length) {
        markInvalid("field-services");
        document.getElementById("err-services").textContent =
          "Este serviço ainda não possui uma profissional habilitada. Edite o serviço para configurar quem pode realizá-lo.";
        first = first || "field-services";
      } else if (!line.profissional || !pros.includes(line.profissional)) {
        markInvalid("field-services");
        document.getElementById("err-services").textContent = "Escolha a profissional responsável por este serviço.";
        first = first || "field-services";
      }
    });
    if (!extraAmount().ok) {
      markInvalid("field-extra");
      first = first || "field-extra";
    }
    if (!first && avail() && occupiesForSave()) {
      const hit = avail().hasAppointmentConflict(draftAppointment(), editingId || "draft");
      if (hit) {
        markInvalid("field-time");
        if (timeError) timeError.textContent = hit.message || "Este horário não está disponível para a profissional.";
        first = first || "field-time";
      }
    }
    renderLines();
    if (first) {
      document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function occupiesForSave() {
    return !avail() || avail().occupiesStatus(status.value);
  }

  function payload() {
    const client = selectedClient();
    const iso = parseDate(dateInput.value);
    const extra = extraAmount().value;
    return {
      clientId: client.id,
      clienteId: client.id,
      client: client.name,
      date: iso,
      data: iso,
      dateLabel: labelDate(iso),
      dateShort: shortDate(iso),
      time: timeInput.value.trim(),
      horario: timeInput.value.trim(),
      servicos: lines.map((line) => ({
        servicoId: line.servicoId,
        nome: line.nome,
        categoria: line.categoria,
        valorReferencia: line.valorReferencia,
        fromPrice: Boolean(line.fromPrice),
        unidadePreco: line.unidadePreco || "",
        modalidade: line.modalidade === "manutencao" ? "manutencao" : "normal",
        profissional: line.profissional
      })),
      valorExtra: extra,
      motivoValorExtra: extraReason.value.trim(),
      formaPagamento: paymentOf(),
      status: status.value,
      notes: notes.value,
      observacoes: notes.value,
      manutencaoId: composerMaintId || ""
    };
  }

  function closeComposer() {
    modal.classList.remove("is-open");
    picker.classList.remove("is-open");
    closePicker();
  }

  function openComposer(options = {}) {
    composerOrigin = options.origin || document.body.dataset.page || "";
    resetForm();
    if (options.appointmentId) {
      const appt = window.StudioState.appointment(options.appointmentId);
      if (appt) fillFrom(appt);
    }
    if (options.clientId) {
      const client = window.StudioState.client(options.clientId);
      if (client) selectClient(client);
    }
    if (options.servicoId) {
      addService(options.servicoId, {
        modalidade: options.modalidade,
        profissional: options.profissional
      });
    }
    if (options.profissional && lines[0] && !lines[0].profissional) {
      const allowed = enabledPros(lines[0].servicoId);
      if (allowed.includes(options.profissional)) {
        lines[0].profissional = options.profissional;
        renderLines();
      }
    }
    if (options.date) {
      const iso = parseDate(options.date) || options.date;
      dateInput.value = labelDate(iso);
      if (window.enhanceDateField) window.enhanceDateField(dateInput);
    }
    if (options.manutencaoId) {
      composerMaintId = options.manutencaoId;
      document.getElementById("new-title").textContent = "Agendar manutenção";
      document.getElementById("new-subtitle").textContent =
        "Isso agenda o retorno. A manutenção só é concluída quando o atendimento for marcado como concluído.";
      document.getElementById("new-submit").textContent = "Agendar manutenção";
      if (!options.appointmentId) status.value = "agendado";
    }
    renderSummary();
    modal.classList.add("is-open");
  }

  function bind() {
    if (bound) return;
    bound = true;

    document.querySelectorAll("[data-open-new-appt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openComposer({ origin: document.body.dataset.page });
      });
    });

    trigger.addEventListener("click", () => {
      picker.classList.toggle("is-open");
      picker.classList.remove("is-invalid");
      if (picker.classList.contains("is-open")) {
        search.focus();
        renderClients();
      }
    });

    document.getElementById("new-client-quick")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openNewClient();
    });

    search.addEventListener("input", renderClients);

    options.addEventListener("click", (event) => {
      if (event.target.closest("[data-new-client-shortcut]")) {
        event.preventDefault();
        event.stopPropagation();
        openNewClient();
        return;
      }
      const btn = event.target.closest("[data-client-option]");
      if (!btn) return;
      selectClient(window.StudioState.client(btn.dataset.clientOption));
    });

    document.getElementById("btn-add-svc").addEventListener("click", openPicker);

    svcList.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove-svc]");
      if (!remove) return;
      lines.splice(Number(remove.dataset.removeSvc), 1);
      document.getElementById("field-services").classList.remove("is-invalid");
      renderLines();
    });

    svcList.addEventListener("change", (event) => {
      const select = event.target.closest("[data-svc-pro]");
      const mod = event.target.closest("[data-svc-mod]");
      if (mod) {
        const index = Number(mod.dataset.svcMod);
        if (!lines[index]) return;
        lines[index].modalidade = mod.value === "manutencao" ? "manutencao" : "normal";
        applyLinePrice(lines[index]);
        renderLines();
        return;
      }
      if (!select) return;
      const index = Number(select.dataset.svcPro);
      if (!lines[index]) return;
      lines[index].profissional = select.value;
      renderLines();
    });

    svcCats.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-svc-cat]");
      if (!btn) return;
      pickerCategory = btn.dataset.svcCat;
      renderPickerCats();
      renderPickerList();
    });

    svcSearch.addEventListener("input", renderPickerList);

    svcPickerList.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-add-svc]");
      if (!btn || btn.disabled) return;
      addService(btn.dataset.addSvc);
    });

    timeSuggest?.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-time-chip]");
      if (!chip) return;
      timeInput.value = chip.dataset.timeChip;
      document.getElementById("field-time")?.classList.remove("is-invalid");
      renderSummary();
      refreshAvailability();
    });

    [dateInput, timeInput, extraInput, extraReason, status, notes, payInput].forEach((field) => {
      if (!field) return;
      field.addEventListener("input", () => {
        if (field === extraInput) document.getElementById("field-extra").classList.remove("is-invalid");
        if (field === payInput) lines.forEach(applyLinePrice);
        renderTotals();
        renderSummary();
        if (field === dateInput || field === timeInput || field === status) refreshAvailability();
        if (field === payInput) renderLines();
      });
      field.addEventListener("change", () => {
        if (field === payInput) lines.forEach(applyLinePrice);
        renderTotals();
        renderSummary();
        if (field === dateInput || field === timeInput || field === status) refreshAvailability();
        if (field === payInput) renderLines();
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (form.dataset.saving === "1") return;
      if (!validate()) return;
      form.dataset.saving = "1";
      const data = payload();
      const appt = editingId
        ? window.StudioState.saveAppointment(editingId, data)
        : window.StudioState.addAppointment(data);
      if (!appt) {
        form.dataset.saving = "";
        const err = window.StudioState.lastScheduleError;
        markInvalid("field-time");
        if (timeError) {
          timeError.textContent =
            (err && err.message) || "Este horário não está disponível para a profissional.";
        }
        document.getElementById("field-time")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const savedId = appt.id;
      closeComposer();
      form.dataset.saving = "";
      if (composerOrigin === "agenda" && window.agendaShowDate) {
        window.agendaShowDate(appt.date);
      }
      if (editingId && typeof window.openAppointment === "function") {
        window.openAppointment(savedId);
      }
      window.toast(
        editingId
          ? "Agendamento atualizado."
          : `${appt.client} · ${appt.time}`
      );
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-close-new]")) {
        closeComposer();
      }
    });

    pickerModal.addEventListener("click", (event) => {
      if (event.target === pickerModal || event.target.closest("[data-close-svc-picker]")) {
        closePicker();
      }
    });

    document.addEventListener("click", (event) => {
      if (!picker.contains(event.target)) picker.classList.remove("is-open");
    });

    document.addEventListener("clients:changed", () => {
      const current = selectedClient();
      if (current) showClient(current);
      renderClients();
      renderSummary();
    });
    document.addEventListener("services:changed", () => {
      renderLines();
      renderPickerList();
    });
  }

  renderPickerCats();
  bind();
  window.openNewAppointment = openComposer;
})();
