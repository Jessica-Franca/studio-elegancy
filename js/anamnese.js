(function () {
  const SECTIONS = [
    { id: "dados", label: "01 Dados" },
    { id: "saude", label: "02 Saúde" },
    { id: "habitos", label: "03 Hábitos" },
    { id: "unhas", label: "04 Unhas" },
    { id: "cilios", label: "05 Cílios" },
    { id: "servico", label: "06 Serviço" },
    { id: "termo", label: "07 Termo" }
  ];

  const CONHECEU = [
    { id: "instagram", label: "Instagram" },
    { id: "indicacao", label: "Indicação" },
    { id: "internet", label: "Internet" },
    { id: "outro", label: "Outro" }
  ];

  const SAUDE = [
    { key: "gestante", q: "Está gestante?" },
    { key: "amamentando", q: "Está amamentando?" },
    { key: "lactante", q: "É lactante?" },
    { key: "diabetes", q: "Possui diabetes?" },
    { key: "hipertensao", q: "Possui hipertensão?", highlight: true },
    { key: "tireoide", q: "Possui problema de tireoide?" },
    { key: "oncologico", q: "Está em tratamento oncológico?" },
    {
      key: "medicamentoContinuo",
      q: "Faz uso de algum medicamento contínuo?",
      extra: "medicamentoQual",
      extraLabel: "Qual?"
    },
    {
      key: "alergiaEsmaltes",
      q: "Possui alergia a esmaltes, cosméticos ou outros?",
      extra: "alergiaQual",
      extraLabel: "Qual?"
    },
    { key: "coagulacao", q: "Possui problemas de coagulação/cicatrização?" },
    { key: "autoimune", q: "Possui alguma doença autoimune?" },
    { key: "glaucoma", q: "Possui glaucoma, blefarite ou outro problema ocular?" },
    { key: "alergiaOlhos", q: "Possui alergia ou sensibilidade nos olhos?" },
    { key: "lentes", q: "Usa lentes de contato?" },
    {
      key: "procedimentoOlhos",
      q: "Fez algum procedimento recente na região dos olhos?",
      extra: "procedimentoOlhosQual",
      extraLabel: "Qual?"
    },
    {
      key: "outraCondicao",
      q: "Existe alguma outra condição importante antes do procedimento?",
      extra: "outraCondicaoQual",
      extraLabel: "Qual?"
    }
  ];

  const HABITOS = [
    { key: "roerUnhas", q: "Costuma roer unhas?" },
    { key: "cuticulas", q: "Tem o hábito de retirar as cutículas?" },
    { key: "esportesImpacto", q: "Pratica esportes de impacto?" },
    { key: "produtosQuimicos", q: "Trabalha com produtos químicos?" },
    { key: "piscinaMar", q: "Entra em piscina/mar com frequência?" },
    { key: "contatoAgua", q: "Tem contato frequente com água?" },
    { key: "muitoMaos", q: "Utiliza muito as mãos no dia a dia?" }
  ];

  const UNHAS = [
    { key: "encravadas", q: "Possui unhas encravadas?" },
    { key: "micose", q: "Possui micose/fungo nas unhas?" },
    { key: "descamacao", q: "Possui descamação, manchas ou alterações na lâmina ungueal?" },
    { key: "sensibilidade", q: "Possui sensibilidade ou dor?" },
    { key: "alergiaProduto", q: "Já teve alergia a algum produto para unhas?" }
  ];

  const CILIOS = [
    { key: "alongamentoAnterior", q: "Já fez alongamento de cílios antes?" },
    { key: "reacaoAnterior", q: "Teve alguma reação no procedimento anterior?" },
    { key: "sensibilidadeOlhos", q: "Possui sensibilidade na região dos olhos?" },
    { key: "maquiagemFrequente", q: "Usa maquiagem nos olhos com frequência?" },
    { key: "quedaFios", q: "Possui queda excessiva de fios?" },
    { key: "rimelDiario", q: "Faz uso de rímel diariamente?" },
    { key: "conjuntivite", q: "Possui histórico de conjuntivite?" },
    { key: "olhoSeco", q: "Possui olho seco?" }
  ];

  const SERVICOS_UNHAS = [
    { id: "tip-gel", label: "Alongamento em Tip Gel" },
    { id: "molde-f1", label: "Alongamento em Molde F1" },
    { id: "soft-gel", label: "Soft Gel" },
    { id: "esmaltacao-gel", label: "Esmaltação em Gel" },
    { id: "esmaltacao-tradicional", label: "Esmaltação Tradicional" },
    { id: "spa-pes", label: "Spa dos Pés" },
    { id: "manutencao-alongamento", label: "Manutenção de Alongamento" },
    { id: "manutencao-gel", label: "Manutenção (Esmaltação em Gel)" },
    { id: "manutencao-tradicional", label: "Manutenção (Esmaltação Tradicional)" },
    { id: "outro", label: "Outro" }
  ];

  const SERVICOS_CILIOS = [
    { id: "alongamento", label: "Alongamento de Cílios" },
    { id: "manutencao", label: "Manutenção de Cílios" },
    { id: "remocao", label: "Remoção de Cílios" }
  ];

  const TERMO_TEXT = `Declaro que as informações acima são verdadeiras, não cabendo ao profissional(a) a responsabilidade por informações omitidas. Autorizo a realização do procedimento escolhido e o registro fotográfico do "antes e depois" para fins de avaliação, divulgação nas redes sociais do Studio Elegancy e portfólio profissional. Estou ciente dos cuidados necessários antes e após o procedimento, e me comprometo a segui-los.`;

  let session = null;

  function todayBR() {
    return window.labelDate(window.StudioState.today);
  }

  function pessoaisFromClient(client) {
    return {
      nome: client.name || "",
      nascimento: client.birth || client.dataNascimento || "",
      endereco: client.endereco || "",
      telefone: client.phone || client.telefone || "",
      email: client.email || "",
      rg: client.rg || "",
      cpf: client.cpf || client.documento || "",
      profissao: client.profissao || "",
      comoConheceu: client.comoConheceu || client.comoNosConheceu || "",
      comoConheceuOutro: client.comoConheceuOutro || ""
    };
  }

  function emptyDraft(client) {
    return {
      clienteId: client.id,
      pessoais: pessoaisFromClient(client),
      saude: {},
      habitos: {},
      unhas: {},
      cilios: {},
      servicosAnamnese: { unhas: [], cilios: [], outro: "" },
      termo: {
        aceite: false,
        local: "",
        data: todayBR(),
        assinatura: ""
      }
    };
  }

  function mergeDraft(client, existing) {
    const base = emptyDraft(client);
    if (!existing) return base;
    return {
      ...base,
      id: existing.id,
      pessoais: pessoaisFromClient(client),
      saude: { ...base.saude, ...(existing.saude || {}) },
      habitos: { ...base.habitos, ...(existing.habitos || {}) },
      unhas: { ...base.unhas, ...(existing.unhas || {}) },
      cilios: { ...base.cilios, ...(existing.cilios || {}) },
      servicosAnamnese: {
        unhas: [...(existing.servicosAnamnese?.unhas || [])],
        cilios: [...(existing.servicosAnamnese?.cilios || [])],
        outro: existing.servicosAnamnese?.outro || ""
      },
      termo: { ...base.termo, ...(existing.termo || {}) }
    };
  }

  function escapeAttr(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function roAttr() {
    return session.mode === "view" ? "disabled" : "";
  }

  function roText() {
    return session.mode === "view" ? "readonly" : "";
  }

  function compactField(label, bind, options = {}) {
    const required = options.required ? " data-required" : "";
    const error = options.error ? `<span class="field-error">${options.error}</span>` : "";
    return `
      <div class="ana-field${options.wide ? " ana-field--wide" : ""}"${required}>
        <label>${label}</label>
        <input class="input" data-bind="${bind}" value="${escapeAttr(options.value || "")}" placeholder="${escapeAttr(options.placeholder || "")}" ${roText()}>
        ${error}
      </div>
    `;
  }

  function ynRow(group, item) {
    const value = session.draft[group][item.key] || "";
    const extraVal = item.extra ? session.draft[group][item.extra] || "" : "";
    const extraOn = item.extra && value === "sim";
    return `
      <div class="ana-row ${item.highlight ? "is-hiper" : ""}">
        <span class="ana-q">${item.q}</span>
        <span class="ana-sn" role="radiogroup" aria-label="${item.q}">
          <label class="ana-radio">
            <input type="radio" name="${group}-${item.key}" value="sim" data-yn-group="${group}" data-yn-field="${item.key}" ${value === "sim" ? "checked" : ""} ${roAttr()}>
            <span>Sim</span>
          </label>
          <label class="ana-radio">
            <input type="radio" name="${group}-${item.key}" value="nao" data-yn-group="${group}" data-yn-field="${item.key}" ${value === "nao" ? "checked" : ""} ${roAttr()}>
            <span>Não</span>
          </label>
        </span>
      </div>
      ${
        item.extra
          ? `<div class="ana-qual" data-extra-for="${group}.${item.key}" ${extraOn ? "" : "hidden"}>
              <label>${item.extraLabel}</label>
              <input class="input ana-line" data-bind="${group}.${item.extra}" value="${escapeAttr(extraVal)}" ${roText()}>
            </div>`
          : ""
      }
    `;
  }

  function optItem(kind, item) {
    const selected = session.draft.servicosAnamnese[kind] || [];
    const on = selected.includes(item.id);
    return `
      <label class="ana-opt">
        <input type="checkbox" data-svc="${kind}" data-id="${item.id}" ${on ? "checked" : ""} ${roAttr()}>
        <span>${item.label}</span>
      </label>
    `;
  }

  function sectionDados() {
    const d = session.draft.pessoais;
    const age = window.idadeLabel(d.nascimento);
    const know = CONHECEU.map(
      (item) => `
        <label class="ana-radio">
          <input type="radio" name="comoConheceu" value="${item.id}" data-conheceu="${item.id}" ${d.comoConheceu === item.id ? "checked" : ""} ${roAttr()}>
          <span>${item.label}</span>
        </label>
      `
    ).join("");
    return `
      <section class="ana-panel ana-panel--full" id="ana-sec-dados">
        <h3>1. Dados pessoais</h3>
        <p class="hint">Vêm do cadastro da cliente. Complete o que faltar — ao salvar, o cadastro é atualizado.</p>
        <div class="ana-grid">
          ${compactField("Nome *", "pessoais.nome", { value: d.nome, required: true, error: "Informe o nome da cliente.", wide: true })}
          ${compactField("Nascimento", "pessoais.nascimento", { value: d.nascimento, placeholder: "10/05/1995" })}
          <div class="ana-field">
            <label>Idade</label>
            <p class="ana-age" id="ana-idade-view">${age || "Informe a data de nascimento"}</p>
          </div>
          ${compactField("Endereço", "pessoais.endereco", { value: d.endereco, wide: true })}
          ${compactField("Telefone", "pessoais.telefone", { value: d.telefone })}
          ${compactField("E-mail", "pessoais.email", { value: d.email })}
          ${compactField("RG", "pessoais.rg", { value: d.rg })}
          ${compactField("CPF", "pessoais.cpf", { value: d.cpf })}
          ${compactField("Profissão", "pessoais.profissao", { value: d.profissao, wide: true })}
        </div>
        <div class="ana-know">
          <span>Como nos conheceu?</span>
          <div class="ana-know-opts">${know}</div>
          <div class="ana-qual ana-qual--inline" data-extra-for="pessoais.comoConheceu" ${d.comoConheceu === "outro" ? "" : "hidden"}>
            <label>Qual?</label>
            <input class="input ana-line" data-bind="pessoais.comoConheceuOutro" value="${escapeAttr(d.comoConheceuOutro || "")}" ${roText()}>
          </div>
        </div>
      </section>
    `;
  }

  function cadastroAlergiasHint() {
    const client = window.StudioState.client(session.clientId) || {};
    const text = String(client.allergies || "").trim();
    if (!text) {
      return `<p class="hint">Alergias do cadastro: não informado. Abaixo, detalhe o que for específico desta ficha.</p>`;
    }
    return `<p class="hint">Alergias no cadastro: <strong>${escapeAttr(text)}</strong>. Abaixo, detalhe o que for específico desta ficha — isso não substitui o cadastro.</p>`;
  }

  function sectionSaude() {
    return `
      <section class="ana-panel" id="ana-sec-saude">
        <h3>2. Avaliação geral de saúde</h3>
        ${cadastroAlergiasHint()}
        ${SAUDE.map((item) => ynRow("saude", item)).join("")}
      </section>
    `;
  }

  function sectionHabitos() {
    const lado = session.draft.habitos.lado || "";
    return `
      <section class="ana-panel" id="ana-sec-habitos">
        <h3>3. Hábitos e rotina</h3>
        ${HABITOS.map((item) => ynRow("habitos", item)).join("")}
        <div class="ana-row ana-row--side">
          <span class="ana-q">Costuma dormir de lado?</span>
          <span class="ana-sn" role="radiogroup" aria-label="Qual lado">
            <label class="ana-radio">
              <input type="radio" name="habitos-lado" value="direito" data-yn-group="habitos" data-yn-field="lado" ${lado === "direito" ? "checked" : ""} ${roAttr()}>
              <span>Direito</span>
            </label>
            <label class="ana-radio">
              <input type="radio" name="habitos-lado" value="esquerdo" data-yn-group="habitos" data-yn-field="lado" ${lado === "esquerdo" ? "checked" : ""} ${roAttr()}>
              <span>Esquerdo</span>
            </label>
          </span>
        </div>
      </section>
    `;
  }

  function sectionUnhas() {
    const obs = session.draft.unhas.observacoes || "";
    return `
      <section class="ana-panel" id="ana-sec-unhas">
        <h3>4. Unhas — avaliação específica</h3>
        ${UNHAS.map((item) => ynRow("unhas", item)).join("")}
        <div class="ana-field ana-field--wide">
          <label>Observações</label>
          <textarea class="textarea ana-notes" data-bind="unhas.observacoes" ${roText()}>${escapeAttr(obs)}</textarea>
        </div>
      </section>
    `;
  }

  function sectionCilios() {
    const obs = session.draft.cilios.observacoes || "";
    return `
      <section class="ana-panel" id="ana-sec-cilios">
        <h3>5. Cílios — avaliação específica</h3>
        ${CILIOS.map((item) => ynRow("cilios", item)).join("")}
        <div class="ana-field ana-field--wide">
          <label>Observações</label>
          <textarea class="textarea ana-notes" data-bind="cilios.observacoes" ${roText()}>${escapeAttr(obs)}</textarea>
        </div>
      </section>
    `;
  }

  function sectionServico() {
    const outroOn = (session.draft.servicosAnamnese.unhas || []).includes("outro");
    const outro = session.draft.servicosAnamnese.outro || "";
    return `
      <section class="ana-panel ana-panel--full" id="ana-sec-servico">
        <h3>6. Serviço a ser realizado</h3>
        <div class="ana-svc">
          <div>
            <p class="ana-svc-title">Unhas</p>
            ${SERVICOS_UNHAS.map((item) => optItem("unhas", item)).join("")}
            <div class="ana-qual ana-qual--inline" data-extra-for="servicosAnamnese.outro" ${outroOn ? "" : "hidden"}>
              <label>Outro</label>
              <input class="input ana-line" data-bind="servicosAnamnese.outro" value="${escapeAttr(outro)}" ${roText()}>
            </div>
          </div>
          <div>
            <p class="ana-svc-title">Cílios</p>
            ${SERVICOS_CILIOS.map((item) => optItem("cilios", item)).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function sectionTermo() {
    const t = session.draft.termo;
    return `
      <section class="ana-panel ana-panel--full" id="ana-sec-termo">
        <h3>7. Termo de responsabilidade</h3>
        <p class="ana-term">${TERMO_TEXT}</p>
        <label class="ana-agree ${session.errors && session.errors.aceite ? "is-invalid" : ""}">
          <input id="ana-aceite" type="checkbox" ${t.aceite ? "checked" : ""} ${roAttr()}>
          <span>Li e estou de acordo com o termo de responsabilidade.</span>
        </label>
        <div class="ana-grid ana-grid--term">
          ${compactField("Local", "termo.local", { value: t.local || "", placeholder: "São Paulo" })}
          ${compactField("Data *", "termo.data", { value: t.data || "", required: true, error: "Informe a data do preenchimento." })}
          <div class="ana-field ana-field--wide">
            <label>Assinatura da cliente</label>
            <input class="input ana-sign" data-bind="termo.assinatura" value="${escapeAttr(t.assinatura || "")}" placeholder=" " ${roText()}>
          </div>
        </div>
      </section>
    `;
  }

  function renderFicha() {
    return `
      ${sectionDados()}
      <div class="ana-cols">
        ${sectionSaude()}
        ${sectionHabitos()}
      </div>
      <div class="ana-cols">
        ${sectionUnhas()}
        ${sectionCilios()}
      </div>
      ${sectionServico()}
      ${sectionTermo()}
    `;
  }

  function capture() {
    const root = document.getElementById("ana-ficha");
    if (!root || !session) return;
    root.querySelectorAll("[data-bind]").forEach((el) => {
      const [group, key] = el.dataset.bind.split(".");
      if (!session.draft[group]) session.draft[group] = {};
      session.draft[group][key] = el.value;
    });
    root.querySelectorAll("[data-yn-group]:checked").forEach((el) => {
      if (!session.draft[el.dataset.ynGroup]) session.draft[el.dataset.ynGroup] = {};
      session.draft[el.dataset.ynGroup][el.dataset.ynField] = el.value;
    });
    const conheceu = root.querySelector("[data-conheceu]:checked");
    if (!session.draft.pessoais) session.draft.pessoais = {};
    session.draft.pessoais.comoConheceu = conheceu ? conheceu.dataset.conheceu : "";
    const unhas = [];
    const cilios = [];
    root.querySelectorAll("[data-svc]:checked").forEach((el) => {
      if (el.dataset.svc === "unhas") unhas.push(el.dataset.id);
      else cilios.push(el.dataset.id);
    });
    session.draft.servicosAnamnese.unhas = unhas;
    session.draft.servicosAnamnese.cilios = cilios;
    if (session.draft.habitos.lado) session.draft.habitos.dormirDeLado = "sim";
    const aceite = document.getElementById("ana-aceite");
    if (aceite) session.draft.termo.aceite = aceite.checked;
  }

  function toggleExtras(root) {
    root.querySelectorAll("[data-extra-for]").forEach((box) => {
      const key = box.dataset.extraFor;
      if (key === "pessoais.comoConheceu") {
        const checked = root.querySelector("[data-conheceu]:checked");
        box.hidden = !(checked && checked.value === "outro");
        return;
      }
      if (key === "servicosAnamnese.outro") {
        const outro = root.querySelector('[data-svc="unhas"][data-id="outro"]');
        box.hidden = !(outro && outro.checked);
        return;
      }
      const [group, field] = key.split(".");
      const sim = root.querySelector(`[data-yn-group="${group}"][data-yn-field="${field}"][value="sim"]`);
      box.hidden = !(sim && sim.checked);
    });
  }

  function paint() {
    const root = document.getElementById("modal-anamnese");
    if (!root || !session) return;
    document.getElementById("ana-ficha").innerHTML = renderFicha();
    document.getElementById("ana-save").hidden = session.mode === "view";
    document.getElementById("ana-edit").hidden = session.mode !== "view";
    root.classList.toggle("ana-readonly", session.mode === "view");
    if (session.errors && session.errors.nome) {
      root.querySelector("#ana-sec-dados [data-required]")?.classList.add("is-invalid");
      document.getElementById("ana-sec-dados")?.scrollIntoView({ block: "nearest" });
    }
    if (session.errors && session.errors.data) {
      root.querySelector("#ana-sec-termo [data-required]")?.classList.add("is-invalid");
    }
    if (session.errors && session.errors.aceite) {
      document.getElementById("ana-sec-termo")?.scrollIntoView({ block: "nearest" });
    }
    if (window.enhanceDateField) {
      window.enhanceDateField(root.querySelector('[data-bind="pessoais.nascimento"]'));
      window.enhanceDateField(root.querySelector('[data-bind="termo.data"]'));
    }
  }

  function closeSheet() {
    document.getElementById("modal-anamnese")?.remove();
    session = null;
  }

  function persistClientFromDraft() {
    const d = session.draft.pessoais || {};
    const current = window.StudioState.client(session.clientId) || {};
    window.StudioState.saveClient(session.clientId, {
      name: String(d.nome || "").trim() || current.name,
      birth: String(d.nascimento || "").trim() || current.birth,
      phone: String(d.telefone || "").trim() || current.phone,
      email: String(d.email || "").trim() || current.email,
      documento: String(d.cpf || "").trim() || current.documento,
      cpf: String(d.cpf || "").trim() || current.cpf,
      endereco: String(d.endereco || "").trim() || current.endereco,
      rg: String(d.rg || "").trim() || current.rg,
      profissao: String(d.profissao || "").trim() || current.profissao,
      comoConheceu: String(d.comoConheceu || "").trim() || current.comoConheceu,
      comoNosConheceu: String(d.comoConheceu || "").trim() || current.comoNosConheceu,
      comoConheceuOutro: d.comoConheceu === "outro" ? String(d.comoConheceuOutro || "").trim() : current.comoConheceuOutro,
      allergies: current.allergies || ""
    });
  }

  function saveFicha() {
    capture();
    const d = session.draft.pessoais || {};
    const t = session.draft.termo;
    session.errors = {};
    if (!String(d.nome || "").trim()) session.errors.nome = true;
    if (!t.aceite) session.errors.aceite = true;
    if (!String(t.data || "").trim()) session.errors.data = true;
    if (session.errors.nome || session.errors.aceite || session.errors.data) {
      paint();
      return;
    }
    persistClientFromDraft();
    window.StudioState.saveAnamnese({
      id: session.draft.id,
      clienteId: session.clientId,
      saude: session.draft.saude,
      habitos: session.draft.habitos,
      unhas: session.draft.unhas,
      cilios: session.draft.cilios,
      servicosAnamnese: session.draft.servicosAnamnese,
      termo: session.draft.termo
    });
    const onSaved = session.onSaved;
    closeSheet();
    window.toast("Anamnese salva com sucesso.");
    if (typeof onSaved === "function") onSaved();
  }

  function ensureSheet() {
    if (document.getElementById("modal-anamnese")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="modal-backdrop is-open" id="modal-anamnese">
        <section class="composer ana-composer" role="dialog" aria-labelledby="ana-title">
          <div class="ana-head">
            <div>
              <span class="brand-heart">♡</span>
              <h2 class="modal-title" id="ana-title">Ficha de anamnese</h2>
              <p class="ana-kicker">Cuidados personalizados para você. <em>Beleza que te representa.</em></p>
            </div>
            <button class="composer-close" type="button" data-close-ana aria-label="Fechar">×</button>
          </div>
          <nav class="ana-index" aria-label="Seções da ficha">
            ${SECTIONS.map((item) => `<a href="#ana-sec-${item.id}" data-ana-jump="${item.id}">${item.label}</a>`).join("")}
          </nav>
          <div class="ana-sheet" id="ana-ficha"></div>
          <div class="ana-actions">
            <button class="btn btn--secondary" id="ana-edit" type="button" hidden>Editar anamnese</button>
            <button class="btn btn--primary" id="ana-save" type="button">Salvar anamnese</button>
          </div>
        </section>
      </div>
      `
    );
    const root = document.getElementById("modal-anamnese");
    root.addEventListener("click", onSheetClick);
    root.addEventListener("change", onSheetChange);
    root.addEventListener("input", onSheetInput);
  }

  function refreshAgeView() {
    const nasc = document.querySelector('[data-bind="pessoais.nascimento"]');
    const view = document.getElementById("ana-idade-view");
    if (!nasc || !view) return;
    view.textContent = window.idadeLabel(nasc.value) || "Informe a data de nascimento";
  }

  function onSheetInput(event) {
    if (!session || session.mode === "view") return;
    if (event.target.dataset.bind === "pessoais.nascimento") refreshAgeView();
  }

  function onSheetChange(event) {
    if (!session || session.mode === "view") return;
    const ficha = document.getElementById("ana-ficha");
    if (ficha) toggleExtras(ficha);
    if (event.target.dataset.bind === "pessoais.nascimento") refreshAgeView();
  }

  function onSheetClick(event) {
    if (!session) return;
    if (event.target.closest("[data-close-ana]") || event.target.id === "modal-anamnese") {
      closeSheet();
      return;
    }
    const jump = event.target.closest("[data-ana-jump]");
    if (jump) {
      event.preventDefault();
      document.getElementById("ana-sec-" + jump.dataset.anaJump)?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (event.target.id === "ana-save") {
      saveFicha();
      return;
    }
    if (event.target.id === "ana-edit") {
      capture();
      session.mode = "edit";
      paint();
    }
  }

  window.openAnamnese = function (options = {}) {
    const client = window.StudioState.client(options.clientId);
    if (!client) return;
    const existing = window.StudioState.anamneseByClient(client.id);
    session = {
      clientId: client.id,
      mode: options.mode || (existing ? "view" : "fill"),
      draft: mergeDraft(client, existing),
      errors: {},
      onSaved: options.onSaved || null
    };
    if (session.mode === "fill" && existing) session.mode = "edit";
    ensureSheet();
    document.getElementById("modal-anamnese").classList.add("is-open");
    paint();
  };

  window.anamneseStatusMarkup = function (client) {
    const ok = Boolean(client && client.anamneseCompleta);
    return `<span class="ana-pill ${ok ? "is-ok" : "is-wait"}"><span class="ana-dot" aria-hidden="true"></span>${ok ? "Completa" : "Pendente"}</span>`;
  };
})();
