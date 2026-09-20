(function () {
  const listView = document.getElementById("crm-list");
  const profile = document.getElementById("crm-profile");
  const tableHost = document.getElementById("client-table");
  if (!listView || !profile || !tableHost) return;

  const TABS = [
    { id: "visao", label: "Visão geral" },
    { id: "pessoais", label: "Dados pessoais" },
    { id: "anamnese", label: "Anamnese" },
    { id: "historico", label: "Atendimentos" },
    { id: "manutencoes", label: "Manutenções" }
  ];

  const CONHECEU = [
    { id: "instagram", label: "Instagram" },
    { id: "indicacao", label: "Indicação" },
    { id: "internet", label: "Internet" },
    { id: "outro", label: "Outro" }
  ];

  const SHORTCUTS = [
    { id: "todas", label: "Todas" },
    { id: "incompleto", label: "Cadastro incompleto" },
    { id: "anamnese", label: "Anamnese pendente" },
    { id: "oferecer", label: "Retornos para oferecer" },
    { id: "vencido", label: "Manutenção vencida" }
  ];

  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
  let selected = params.get("cliente") || hash.get("cliente") || "";
  let tab = normalizeTab(params.get("tab") || hash.get("tab"));
  const filters = {
    cadastro: "todos",
    anamnese: "todas",
    retorno: "todos",
    profissional: "todas"
  };
  let clientSort = null;
  applyLegacyFiltro(params.get("filtro"));
  if (params.get("cadastro")) filters.cadastro = params.get("cadastro");
  if (params.get("anamnese")) filters.anamnese = params.get("anamnese");
  if (params.get("retorno")) filters.retorno = params.get("retorno");
  if (params.get("profissional")) filters.profissional = params.get("profissional");

  function normalizeTab(value) {
    if (value === "resumo" || value === "visao-geral") return "visao";
    if (value === "agendamentos" || value === "atendimentos") return "historico";
    if (TABS.some((item) => item.id === value)) return value;
    return "visao";
  }

  function applyLegacyFiltro(value) {
    if (value === "anamnese") filters.anamnese = "pendente";
    if (value === "incompleto") filters.cadastro = "incompleto";
    if (value === "manut-proxima" || value === "oferecer") filters.retorno = "oferecer";
    if (value === "manut-vencida" || value === "vencido") filters.retorno = "vencido";
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function allClients() {
    return window.StudioState.listClients();
  }

  function maint() {
    return window.StudioMaintenance || null;
  }

  function returnInfo(client) {
    if (maint() && typeof maint().returnKind === "function") return maint().returnKind(client.id);
    return { id: "nenhum", label: "—", cycle: null };
  }

  function lastVisit(client) {
    const today = window.StudioState.today;
    const rows = window.StudioState.byClient(client.id).filter((item) => item.status !== "cancelado");
    const done = rows.filter((item) => item.status === "concluido");
    const donePast = done.filter((item) => item.date <= today);
    const past = rows.filter((item) => item.date <= today);
    const pool = donePast.length ? donePast : past.length ? past : done;
    return pool.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0] || null;
  }

  function nextVisit(client) {
    return client.nextAppt || null;
  }

  function clientHasPro(client, profissional) {
    return window.StudioState.byClient(client.id).some(
      (appt) =>
        appt.status !== "cancelado" &&
        (appt.servicos || []).some((line) => line.profissional === profissional)
    );
  }

  function matchesFilters(item) {
    if (filters.cadastro === "completo" && !item.cadastroCompleto) return false;
    if (filters.cadastro === "incompleto" && item.cadastroCompleto) return false;
    if (filters.anamnese === "completa" && !item.anamneseCompleta) return false;
    if (filters.anamnese === "pendente" && item.anamneseCompleta) return false;
    if (filters.retorno === "oferecer" && !(maint() && maint().clientHasOffer(item.id))) return false;
    if (filters.retorno === "agendado" && !(maint() && maint().clientHasScheduled(item.id))) return false;
    if (filters.retorno === "vencido" && !(maint() && maint().clientHasOverdue(item.id))) return false;
    if (filters.profissional !== "todas" && !clientHasPro(item, filters.profissional)) return false;
    return true;
  }

  function searchTerm() {
    return (document.getElementById("client-search")?.value || "").trim().toLowerCase();
  }

  function matchesSearch(item, term) {
    if (!term) return true;
    const blob = `${item.name} ${item.phone} ${item.whatsapp} ${item.documento} ${item.cpf} ${item.rg} ${item.email} ${digits(item.phone)} ${digits(item.whatsapp)} ${digits(item.documento)} ${digits(item.cpf)}`
      .toLowerCase();
    if (blob.includes(term)) return true;
    const numeric = term.replace(/\D/g, "");
    return Boolean(numeric) && blob.includes(numeric);
  }

  function filteredClients() {
    const term = searchTerm();
    const rows = allClients().filter((item) => matchesFilters(item) && matchesSearch(item, term));
    if (!window.StudioTables) return rows;
    return window.StudioTables.sortRows(rows, clientSort, {
      name: { type: "text", value: (item) => item.name || "" },
      phone: { type: "text", value: (item) => item.whatsapp || item.phone || "" },
      last: { type: "date", value: (item) => (lastVisit(item) || {}).date || "" },
      next: { type: "date", value: (item) => (nextVisit(item) || {}).date || "" },
      cadastro: { type: "text", value: (item) => cadastroLabel(item) },
      anamnese: { type: "text", value: (item) => anamneseLabel(item) },
      retorno: { type: "text", value: (item) => returnInfo(item).label || "" }
    });
  }

  function filterCounts() {
    const items = allClients();
    return {
      todas: items.length,
      incompleto: items.filter((item) => !item.cadastroCompleto).length,
      anamnese: items.filter((item) => !item.anamneseCompleta).length,
      oferecer: items.filter((item) => maint() && maint().clientHasOffer(item.id)).length,
      vencido: items.filter((item) => maint() && maint().clientHasOverdue(item.id)).length
    };
  }

  function shortcutActive() {
    const onlyCadastro = filters.cadastro === "incompleto" && filters.anamnese === "todas" && filters.retorno === "todos" && filters.profissional === "todas";
    const onlyAna = filters.cadastro === "todos" && filters.anamnese === "pendente" && filters.retorno === "todos" && filters.profissional === "todas";
    const onlyOffer = filters.cadastro === "todos" && filters.anamnese === "todas" && filters.retorno === "oferecer" && filters.profissional === "todas";
    const onlyOver = filters.cadastro === "todos" && filters.anamnese === "todas" && filters.retorno === "vencido" && filters.profissional === "todas";
    const none = filters.cadastro === "todos" && filters.anamnese === "todas" && filters.retorno === "todos" && filters.profissional === "todas";
    if (none) return "todas";
    if (onlyCadastro) return "incompleto";
    if (onlyAna) return "anamnese";
    if (onlyOffer) return "oferecer";
    if (onlyOver) return "vencido";
    return "";
  }

  function applyShortcut(id) {
    filters.cadastro = "todos";
    filters.anamnese = "todas";
    filters.retorno = "todos";
    filters.profissional = "todas";
    if (id === "incompleto") filters.cadastro = "incompleto";
    if (id === "anamnese") filters.anamnese = "pendente";
    if (id === "oferecer") filters.retorno = "oferecer";
    if (id === "vencido") filters.retorno = "vencido";
    const search = document.getElementById("client-search");
    if (search) search.value = "";
    syncFilterControls();
  }

  function syncFilterControls() {
    const cad = document.getElementById("filter-cadastro");
    const ana = document.getElementById("filter-anamnese");
    const ret = document.getElementById("filter-retorno");
    const pro = document.getElementById("filter-pro");
    if (cad) cad.value = filters.cadastro;
    if (ana) ana.value = filters.anamnese;
    if (ret) ret.value = filters.retorno;
    if (pro) pro.value = filters.profissional;
  }

  function money(value) {
    return window.formatMoney(value);
  }

  function lastLabel(client) {
    const visit = lastVisit(client);
    return visit ? window.displayDate(visit.date) : "—";
  }

  function nextLabel(client) {
    const visit = nextVisit(client);
    if (!visit) return "—";
    return `${window.displayDate(visit.date)} · ${visit.time || "—"}`;
  }

  function cadastroLabel(client) {
    return client.cadastroCompleto ? "Completo" : "Incompleto";
  }

  function anamneseLabel(client) {
    return client.anamneseCompleta ? "Completa" : "Pendente";
  }

  function returnCell(client) {
    const info = returnInfo(client);
    if (!info.cycle) return `<span class="crm-muted">—</span>`;
    const when = window.displayDate(info.cycle.dataPrevista);
    return `<span class="crm-return is-${info.id}">${esc(info.label)}</span><span class="crm-return-meta">${esc(info.cycle.servicoNome || info.cycle.servicoOriginalNome)} · ${esc(when)}</span>`;
  }

  function renderCounters() {
    const host = document.getElementById("client-filters");
    if (!host) return;
    const counts = filterCounts();
    const active = shortcutActive();
    host.innerHTML = SHORTCUTS.map((item) => {
      const count = counts[item.id];
      return `<button class="segment ${active === item.id ? "is-active" : ""}" type="button" data-client-filter="${item.id}">${esc(item.label)} ${count}</button>`;
    }).join("");
  }

  function renderTable() {
    renderCounters();
    syncFilterControls();
    const items = filteredClients();
    const count = document.getElementById("crm-count");
    if (count) {
      count.textContent =
        items.length === 1 ? "1 cliente encontrada" : `${items.length} clientes encontradas`;
    }
    if (!items.length) {
      tableHost.innerHTML = `<div class="agenda-empty"><p>Nenhuma cliente encontrada.</p><p class="hint">Ajuste a busca ou limpe os filtros.</p></div>`;
      return;
    }
    const th = (label, key) =>
      window.StudioTables ? window.StudioTables.header(label, key, clientSort) : `<th>${label}</th>`;
    tableHost.innerHTML = `
      <div class="agenda-table-wrap crm-table-wrap">
        <table class="agenda-table crm-table">
          <thead>
            <tr>
              ${th("Cliente", "name")}
              ${th("Telefone / WhatsApp", "phone")}
              ${th("Último atendimento", "last")}
              ${th("Próximo atendimento", "next")}
              ${th("Status do cadastro", "cadastro")}
              ${th("Anamnese", "anamnese")}
              ${th("Retorno", "retorno")}
            </tr>
          </thead>
          <tbody>
            ${items
              .map((item) => {
                const phone = item.whatsapp || item.phone || "—";
                return `
                  <tr class="agenda-row crm-row" data-client="${esc(item.id)}" tabindex="0">
                    <td class="crm-name">${esc(item.name)}</td>
                    <td>${esc(phone)}</td>
                    <td>${esc(lastLabel(item))}</td>
                    <td>${esc(nextLabel(item))}</td>
                    <td><span class="crm-pill is-${item.cadastroCompleto ? "ok" : "wait"}">${esc(cadastroLabel(item))}</span></td>
                    <td><span class="crm-pill is-${item.anamneseCompleta ? "ok" : "wait"}">${esc(anamneseLabel(item))}</span></td>
                    <td>${returnCell(item)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function metric(label, value, extra) {
    return `
      <article class="crm-metric">
        <span class="kicker">${label}</span>
        <p>${value || "—"}</p>
        ${extra ? `<span class="crm-metric-extra">${extra}</span>` : ""}
      </article>
    `;
  }

  function visao(client) {
    const info = returnInfo(client);
    const last = lastVisit(client);
    const next = nextVisit(client);
    let retornoExtra = "—";
    if (info.cycle) {
      retornoExtra = `${info.cycle.servicoNome || info.cycle.servicoOriginalNome} · Previsão ${window.displayDate(info.cycle.dataPrevista)}`;
    }
    return `
      <div class="crm-metrics">
        ${metric("Idade", window.idadeLabel(client.birth) || "Informe a data de nascimento")}
        ${metric("Atendimentos", String(client.visitCount || 0))}
        ${metric("Valor histórico", client.historyTotal)}
        ${metric("Cadastro", cadastroLabel(client), client.cadastroCompleto ? "" : `${client.completeness}%`)}
        ${metric("Anamnese", anamneseLabel(client))}
        ${metric("Retorno", info.label, retornoExtra === "—" ? "" : retornoExtra)}
      </div>
      <div class="crm-metrics crm-metrics--two">
        ${metric("Último atendimento", last ? `${window.displayDate(last.date)} · ${last.time || "—"}` : "—", last ? (last.servicos || []).map((line) => line.nome).join(" · ") : "")}
        ${metric("Próximo atendimento", next ? `${window.displayDate(next.date)} · ${next.time || "—"}` : "—", next ? (next.servicos || []).map((line) => line.nome).join(" · ") : "")}
      </div>
      <article class="card card--pad crm-allergies">
        <span class="kicker">Alergias</span>
        <p>${esc(client.allergies) || "Não informado"}</p>
      </article>
      ${
        client.anamneseCompleta
          ? ""
          : `<article class="card ana-banner">
              <span class="kicker">Próximo passo</span>
              <h3>Preencher anamnese</h3>
              <p>A ficha detalhada não abre sozinha. Preencha quando for o momento do atendimento.</p>
              <div class="btn-row" style="margin-top:12px">
                <button class="btn btn--primary" data-ana="fill" type="button">+ Preencher anamnese</button>
              </div>
            </article>`
      }
    `;
  }

  function pessoais(client) {
    const know = CONHECEU.map(
      (item) => `
        <button class="side-btn ${client.comoConheceu === item.id ? "is-on" : ""}" type="button" data-perfil-conheceu="${item.id}">${item.label}</button>
      `
    ).join("");
    return `
      <p class="hint">Complementa o cadastro da mesma cliente. Não cria um segundo registro. A idade é calculada pela data de nascimento.</p>
      <form class="form-grid" id="perfil-pessoal">
        <div class="field" data-required>
          <label for="perfil-nome">Nome *</label>
          <input class="input" id="perfil-nome" value="${esc(client.name || "")}">
          <span class="field-error">Informe o nome da cliente.</span>
        </div>
        <div class="when-row">
          <div class="field">
            <label for="perfil-cpf">CPF</label>
            <input class="input" id="perfil-cpf" value="${esc(client.cpf || client.documento || "")}">
          </div>
          <div class="field">
            <label for="perfil-rg">RG</label>
            <input class="input" id="perfil-rg" value="${esc(client.rg || "")}">
          </div>
        </div>
        <div class="when-row">
          <div class="field">
            <label for="perfil-nasc">Data de nascimento</label>
            <input class="input" id="perfil-nasc" value="${esc(client.birth || "")}" placeholder="10/05/1995">
          </div>
          <div class="field">
            <label>Idade</label>
            <p class="perfil-idade" id="perfil-idade-view">${esc(window.idadeLabel(client.birth) || "Informe a data de nascimento")}</p>
          </div>
        </div>
        <div class="when-row">
          <div class="field">
            <label for="perfil-tel">Telefone</label>
            <input class="input" id="perfil-tel" value="${esc(client.phone || "")}">
          </div>
          <div class="field">
            <label for="perfil-whats">WhatsApp</label>
            <input class="input" id="perfil-whats" value="${esc(client.whatsapp || "")}">
          </div>
        </div>
        <div class="field">
          <label for="perfil-email">E-mail</label>
          <input class="input" id="perfil-email" type="email" value="${esc(client.email || "")}">
        </div>
        <div class="field">
          <label for="perfil-prof">Profissão</label>
          <input class="input" id="perfil-prof" value="${esc(client.profissao || "")}">
        </div>
        <div class="field">
          <label>Como nos conheceu</label>
          <div class="know-row" id="perfil-conheceu">${know}</div>
          <input type="hidden" id="perfil-conheceu-val" value="${esc(client.comoConheceu || "")}">
        </div>
        <div class="field" id="perfil-conheceu-outro-wrap" ${client.comoConheceu === "outro" ? "" : "hidden"}>
          <label for="perfil-conheceu-outro">Qual?</label>
          <input class="input" id="perfil-conheceu-outro" value="${esc(client.comoConheceuOutro || "")}">
        </div>
        <div class="field">
          <label for="perfil-end">Endereço</label>
          <input class="input" id="perfil-end" value="${esc(client.endereco || "")}">
        </div>
        <div class="field">
          <label for="perfil-alergias">Alergias</label>
          <textarea class="textarea textarea--short" id="perfil-alergias" placeholder="Ex.: esmalte, látex, níquel.">${esc(client.allergies || "")}</textarea>
          <p class="hint">Informação geral do cadastro. O detalhamento por procedimento fica na anamnese.</p>
        </div>
        <div class="field">
          <label for="perfil-obs">Observações</label>
          <textarea class="textarea textarea--short" id="perfil-obs">${esc(client.notes || client.observacoes || "")}</textarea>
        </div>
        <div class="btn-row">
          <button class="btn btn--primary" type="submit">Salvar dados pessoais</button>
        </div>
      </form>
    `;
  }

  function saudeLines(saude) {
    const map = [
      ["gestante", "Está gestante?"],
      ["amamentando", "Está amamentando?"],
      ["lactante", "É lactante?"],
      ["diabetes", "Possui diabetes?"],
      ["hipertensao", "Possui hipertensão?"],
      ["tireoide", "Possui problema de tireoide?"],
      ["oncologico", "Está em tratamento oncológico?"],
      ["medicamentoContinuo", "Medicamento contínuo", "medicamentoQual"],
      ["alergiaEsmaltes", "Alergia a esmaltes, cosméticos ou outros", "alergiaQual"],
      ["coagulacao", "Problemas de coagulação/cicatrização"],
      ["autoimune", "Doença autoimune"],
      ["glaucoma", "Glaucoma, blefarite ou outro problema ocular"],
      ["alergiaOlhos", "Alergia ou sensibilidade nos olhos"],
      ["lentes", "Usa lentes de contato"],
      ["procedimentoOlhos", "Procedimento recente na região dos olhos", "procedimentoOlhosQual"],
      ["outraCondicao", "Outra condição importante", "outraCondicaoQual"]
    ];
    return map
      .map(([key, label, extra]) => {
        const value = saude[key];
        if (!value) return "";
        const extraText = extra && value === "sim" && saude[extra] ? ` · ${saude[extra]}` : "";
        return `<p><strong>${label}</strong>  ·  ${value === "sim" ? "Sim" : "Não"}${extraText}</p>`;
      })
      .join("");
  }

  function anamnese(client) {
    const ok = client.anamneseCompleta;
    const ana = client.anamnese;
    const data = client.anamneseData ? window.displayDate(client.anamneseData) : "";
    const saude = ana?.saude || {};
    return `
      <article class="card ana-banner">
        <span class="kicker">Ficha de anamnese</span>
        <h3>Anamnese</h3>
        <div class="ana-flag">${window.anamneseStatusMarkup(client)}</div>
        ${
          ok || ana
            ? `<p class="hint">Ficha preenchida${data ? ` em ${window.displayDate(ana.dataPreenchimento || data)}` : ""}.</p>
               <div class="btn-row" style="margin-top:12px">
                 <button class="btn btn--secondary" data-ana="view" type="button">Visualizar</button>
                 <button class="btn btn--primary" data-ana="edit" type="button">Editar</button>
               </div>`
            : `<p>Esta cliente ainda não possui uma ficha de anamnese preenchida.</p>
               <div class="btn-row" style="margin-top:12px">
                 <button class="btn btn--primary" data-ana="fill" type="button">+ Preencher anamnese</button>
               </div>`
        }
      </article>
      ${
        ana
          ? `<div class="card ficha">
              <span class="kicker">Registro informado</span>
              ${saudeLines(saude) || "<p class='hint'>Nenhuma resposta de saúde registrada ainda.</p>"}
            </div>`
          : ""
      }
    `;
  }

  function historico(client) {
    const rows = window.StudioState.byClient(client.id).sort((a, b) =>
      (b.date + b.time).localeCompare(a.date + a.time)
    );
    if (!rows.length) return `<p class="empty">Nenhum atendimento registrado.</p>`;
    const body = rows
      .flatMap((item) => {
        const lines = item.servicos && item.servicos.length ? item.servicos : [{ nome: "Serviços a definir", profissional: "", valorReferencia: item.valor || 0 }];
        const extra = item.valorExtra
          ? [
              {
                nome: `Valor extra${item.motivoValorExtra ? ` · ${item.motivoValorExtra}` : ""}`,
                profissional: "",
                valorReferencia: item.valorExtra
              }
            ]
          : [];
        return lines.concat(extra).map(
          (line) => `
            <tr class="agenda-row" data-appt="${esc(item.id)}">
              <td>${esc(window.displayDate(item.date))}</td>
              <td>${esc(item.time || "—")}</td>
              <td>${esc(line.nome || "—")}</td>
              <td>${esc(line.profissional || "—")}</td>
              <td>${esc(money(line.valorReferencia))}</td>
              <td><span class="${window.badgeClass(item.status)}">${esc(window.statusLabel(item.status))}</span></td>
            </tr>
          `
        );
      })
      .join("");
    return `
      <div class="agenda-table-wrap crm-table-wrap">
        <table class="agenda-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Horário</th>
              <th>Serviço</th>
              <th>Profissional</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  function renderProfile() {
    const client = window.StudioState.client(selected);
    if (!client) {
      selected = "";
      render();
      return;
    }
    const ok = client.anamneseCompleta;
    const panels = {
      visao: visao(client),
      pessoais: pessoais(client),
      anamnese: anamnese(client),
      historico: historico(client),
      manutencoes: maint()
        ? maint().renderClientSection(client.id)
        : `<p class="empty">Manutenções indisponíveis.</p>`
    };
    profile.innerHTML = `
      <button class="crm-back" type="button" id="crm-back">← Voltar para clientes</button>
      <section class="card card--pad profile-sheet crm-sheet">
        <div class="crm-profile-head">
          <div>
            <h2 class="profile-name"><span class="brand-heart" aria-hidden="true">♡</span> ${esc(client.name)}</h2>
            <p class="hint">${esc(client.since)}</p>
            <p class="crm-head-status">${esc(cadastroLabel(client))}${client.cadastroCompleto ? "" : ` · ${client.completeness}%`} · Anamnese ${esc(anamneseLabel(client).toLowerCase())}</p>
          </div>
          <div class="btn-row crm-profile-actions">
            <button class="btn btn--secondary" id="edit-client" type="button">Editar cliente</button>
            <button class="btn ${ok ? "btn--secondary" : "btn--primary"}" data-ana="${ok ? "edit" : "fill"}" type="button">${ok ? "Ver anamnese" : "+ Preencher anamnese"}</button>
            <button class="btn ${ok ? "btn--primary" : "btn--secondary"}" id="profile-new-appt" type="button">+ Novo agendamento</button>
          </div>
        </div>
        <div class="segments crm-tabs">
          ${TABS.map(
            (item) =>
              `<button class="segment ${tab === item.id ? "is-active" : ""}" data-tab="${item.id}" type="button">${item.label}</button>`
          ).join("")}
        </div>
        <div class="crm-panel">${panels[tab]}</div>
      </section>
    `;
    if (window.enhanceDateField) window.enhanceDateField(document.getElementById("perfil-nasc"));
  }

  function render() {
    const showProfile = Boolean(selected && window.StudioState.client(selected));
    listView.hidden = showProfile;
    profile.hidden = !showProfile;
    if (showProfile) renderProfile();
    else renderTable();
  }

  function openAna(mode) {
    window.openAnamnese({
      clientId: selected,
      mode,
      onSaved() {
        tab = "anamnese";
        render();
      }
    });
  }

  function openClient(id) {
    selected = id;
    tab = "visao";
    render();
  }

  tableHost.addEventListener("click", (event) => {
    if (event.target.closest("[data-sort]")) return;
    const row = event.target.closest("[data-client]");
    if (!row) return;
    openClient(row.dataset.client);
  });
  tableHost.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest("[data-client]");
    if (!row) return;
    event.preventDefault();
    openClient(row.dataset.client);
  });

  profile.addEventListener("click", (event) => {
    if (event.target.id === "crm-back" || event.target.closest("#crm-back")) {
      selected = "";
      render();
      return;
    }
    const tabBtn = event.target.closest("[data-tab]");
    if (tabBtn) {
      tab = tabBtn.dataset.tab;
      render();
      return;
    }
    const anaBtn = event.target.closest("[data-ana]");
    if (anaBtn) {
      openAna(anaBtn.dataset.ana);
      return;
    }
    const know = event.target.closest("[data-perfil-conheceu]");
    if (know) {
      document.getElementById("perfil-conheceu-val").value = know.dataset.perfilConheceu;
      document.getElementById("perfil-conheceu-outro-wrap").hidden =
        know.dataset.perfilConheceu !== "outro";
      profile.querySelectorAll("[data-perfil-conheceu]").forEach((btn) => {
        btn.classList.toggle("is-on", btn === know);
      });
      return;
    }
    if (event.target.id === "edit-client") {
      window.openClientForm({
        clientId: selected,
        onSaved(client) {
          selected = client.id;
          tab = "visao";
          render();
        }
      });
      return;
    }
    if (event.target.id === "profile-new-appt") {
      if (typeof window.openNewAppointment === "function") {
        window.openNewAppointment({ clientId: selected, origin: "clientes" });
      }
    }
  });

  profile.addEventListener("input", (event) => {
    if (event.target.id !== "perfil-nasc") return;
    const view = document.getElementById("perfil-idade-view");
    if (view) {
      view.textContent = window.idadeLabel(event.target.value) || "Informe a data de nascimento";
    }
  });

  profile.addEventListener("submit", (event) => {
    if (event.target.id !== "perfil-pessoal") return;
    event.preventDefault();
    const nameField = event.target.querySelector("[data-required]");
    const name = document.getElementById("perfil-nome").value.trim();
    if (!name) {
      nameField.classList.add("is-invalid");
      document.getElementById("perfil-nome").focus();
      return;
    }
    const result = window.StudioState.saveClient(selected, {
      name,
      birth: document.getElementById("perfil-nasc").value.trim(),
      endereco: document.getElementById("perfil-end").value.trim(),
      phone: document.getElementById("perfil-tel").value.trim(),
      whatsapp: document.getElementById("perfil-whats").value.trim(),
      email: document.getElementById("perfil-email").value.trim(),
      rg: document.getElementById("perfil-rg").value.trim(),
      cpf: document.getElementById("perfil-cpf").value.trim(),
      documento: document.getElementById("perfil-cpf").value.trim(),
      profissao: document.getElementById("perfil-prof").value.trim(),
      comoConheceu: document.getElementById("perfil-conheceu-val").value,
      comoNosConheceu: document.getElementById("perfil-conheceu-val").value,
      comoConheceuOutro: document.getElementById("perfil-conheceu-outro").value.trim(),
      allergies: document.getElementById("perfil-alergias").value.trim(),
      notes: document.getElementById("perfil-obs").value.trim(),
      observacoes: document.getElementById("perfil-obs").value.trim()
    });
    if (result && result.client) {
      selected = result.client.id;
      window.toast("Dados pessoais atualizados.");
      render();
    }
  });

  document.getElementById("client-search")?.addEventListener("input", renderTable);
  document.getElementById("client-filters")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-client-filter]");
    if (!btn) return;
    applyShortcut(btn.dataset.clientFilter);
    renderTable();
  });
  ["filter-cadastro", "filter-anamnese", "filter-retorno", "filter-pro"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      if (id === "filter-cadastro") filters.cadastro = event.target.value;
      if (id === "filter-anamnese") filters.anamnese = event.target.value;
      if (id === "filter-retorno") filters.retorno = event.target.value;
      if (id === "filter-pro") filters.profissional = event.target.value;
      renderTable();
    });
  });
  document.getElementById("crm-clear")?.addEventListener("click", () => {
    applyShortcut("todas");
    renderTable();
  });
  document.getElementById("new-client")?.addEventListener("click", () => {
    window.openClientForm({
      source: "clientes",
      onSaved(client) {
        selected = client.id;
        tab = "visao";
        render();
      }
    });
  });

  document.addEventListener("appointments:changed", render);
  document.addEventListener("clients:changed", render);
  document.addEventListener("anamnese:changed", render);
  document.addEventListener("manutencoes:changed", render);
  if (window.StudioTables) {
    window.StudioTables.bind(tableHost, (key) => {
      clientSort = window.StudioTables.nextState(clientSort, key);
      renderTable();
    });
  }
  render();
})();
