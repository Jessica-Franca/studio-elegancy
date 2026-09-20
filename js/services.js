(function () {
  const root = document.getElementById("service-root");
  const search = document.getElementById("svc-search");
  const cats = document.getElementById("svc-cats");
  const statusFilter = document.getElementById("svc-status-filter");
  const newBtn = document.getElementById("new-service");
  const modal = document.getElementById("modal-service");
  const form = document.getElementById("service-form");
  const title = document.getElementById("service-modal-title");
  const confirmModal = document.getElementById("modal-service-confirm");
  const confirmText = document.getElementById("service-confirm-text");
  const confirmExtra = document.getElementById("service-confirm-extra");
  const confirmDeactivate = document.getElementById("service-confirm-deactivate");
  const confirmDelete = document.getElementById("service-confirm-delete");

  const fieldNome = document.getElementById("svc-nome");
  const fieldCategoria = document.getElementById("svc-categoria");
  const fieldSubgrupo = document.getElementById("svc-subgrupo");
  const fieldPix = document.getElementById("svc-pix");
  const fieldCartao = document.getElementById("svc-cartao");
  const fieldDuracao = document.getElementById("svc-duracao");
  const fieldTipo = document.getElementById("svc-tipo");
  const fieldUnidade = document.getElementById("svc-unidade");
  const fieldObs = document.getElementById("svc-obs");
  const fieldPros = document.getElementById("svc-pros");
  const fieldWarn = document.getElementById("svc-pro-warn");
  const statusLabel = document.getElementById("svc-status-label");
  const exigeBox = document.getElementById("svc-exige-check");
  const maintFields = document.getElementById("svc-maint-fields");
  const fieldPrazo = document.getElementById("svc-prazo");
  const fieldPrazoUnidade = document.getElementById("svc-prazo-unidade");
  const fieldRegra = document.getElementById("svc-regra");
  const fieldPixMaint = document.getElementById("svc-pix-maint");
  const fieldCartaoMaint = document.getElementById("svc-cartao-maint");
  const editActions = document.getElementById("svc-edit-actions");
  const toggleActive = document.getElementById("svc-toggle-active");
  const deleteBtn = document.getElementById("svc-delete");
  const submitBtn = document.getElementById("svc-submit");

  let categoryFilter = "all";
  let mode = "create";
  let editingId = "";
  let editingAtivo = true;
  let exigeManutencao = false;

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fold(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function money(value) {
    return window.formatCurrency(value);
  }

  function priceLabel(item, value) {
    if (window.StudioState.formatServicePrice) {
      return window.StudioState.formatServicePrice(item, value);
    }
    const text = money(value);
    const prefix = item.tipoPreco === "a_partir_de" || item.fromPrice ? "A partir de " : "";
    const suffix = item.unidadePreco === "por unha" ? " por unha" : "";
    return prefix + text + suffix;
  }

  function parseMoneyField(input) {
    const raw = String((input && input.value) || "").trim();
    if (!raw) return { ok: false, value: 0 };
    const value = window.parseMoedaBR(raw);
    if (!Number.isFinite(value) || value < 0) return { ok: false, value: 0 };
    return { ok: true, value };
  }

  function professionals() {
    return (window.StudioState.PROFESSIONALS || ["Bruna", "Amanda"]).slice();
  }

  function categories() {
    if (window.StudioState.listCategories) return window.StudioState.listCategories();
    return window.StudioState.CATEGORIES || ["Unhas", "Cílios", "Sobrancelhas"];
  }

  function selectedPros() {
    return [...fieldPros.querySelectorAll("input[type=checkbox]:checked")].map((input) => input.value);
  }

  function parseDuracao() {
    const raw = String(fieldDuracao && fieldDuracao.value || "").trim();
    if (!raw) return { ok: false, value: 0 };
    const value = Math.round(Number(raw.replace(",", ".")));
    if (!Number.isFinite(value) || value <= 0 || value > 720) return { ok: false, value: 0 };
    return { ok: true, value };
  }

  function markField(id, invalid) {
    const field = document.getElementById(id);
    if (!field) return;
    field.classList.toggle("is-invalid", Boolean(invalid));
  }

  function renderCats() {
    const tabs = [{ id: "all", label: "Todas" }].concat(
      categories().map((name) => ({ id: name, label: name }))
    );
    cats.innerHTML = tabs
      .map(
        (tab) =>
          `<button class="segment ${categoryFilter === tab.id ? "is-active" : ""}" type="button" data-svc-cat="${esc(tab.id)}">${esc(tab.label)}</button>`
      )
      .join("");
  }

  function renderPros(selected) {
    const chosen = new Set(selected || []);
    fieldPros.innerHTML = professionals()
      .map(
        (name) => `
        <label class="check-pill">
          <input type="checkbox" value="${esc(name)}" ${chosen.has(name) ? "checked" : ""}>
          <span>${esc(name)}</span>
        </label>
      `
      )
      .join("");
    updateProWarn();
  }

  function updateProWarn() {
    const empty = !selectedPros().length;
    fieldWarn.hidden = !empty;
  }

  function fillCategories(selected) {
    const list = categories();
    fieldCategoria.innerHTML = list
      .map((name) => `<option value="${esc(name)}" ${name === selected ? "selected" : ""}>${esc(name)}</option>`)
      .join("");
    if (selected && list.indexOf(selected) >= 0) fieldCategoria.value = selected;
  }

  function fillSubgroups(categoria, current) {
    const options = window.StudioState.subgroupsFor(categoria) || [];
    if (!options.length) {
      fieldSubgrupo.innerHTML = `<option value="">Nenhum subgrupo cadastrado</option>`;
      fieldSubgrupo.value = "";
      return;
    }
    const valid = Boolean(current && options.indexOf(current) >= 0);
    fieldSubgrupo.innerHTML =
      (valid ? "" : `<option value="">Selecione o subgrupo</option>`) +
      options
        .map((name) => `<option value="${esc(name)}" ${name === current ? "selected" : ""}>${esc(name)}</option>`)
        .join("");
    fieldSubgrupo.value = valid ? current : "";
  }

  function statusMarkup(ativo) {
    if (ativo) {
      return `<span class="svc-status"><span class="svc-status-dot"></span>Ativo</span>`;
    }
    return `<span class="svc-status is-off"><span class="svc-status-dot"></span>Inativo</span>`;
  }

  function filtered() {
    const term = fold(search.value);
    const status = statusFilter.value;
    return window.StudioState.listServices().filter((item) => {
      if (categoryFilter !== "all" && item.categoria !== categoryFilter) return false;
      if (status === "ativos" && item.ativo === false) return false;
      if (status === "inativos" && item.ativo !== false) return false;
      if (item.legadoManutencaoSolta) return false;
      if (!term) return true;
      return fold(`${item.nome} ${item.categoria} ${item.subgrupo}`).includes(term);
    });
  }

  function prazoLabel(item) {
    if (!item.exigeManutencao) return "";
    if (item.manutencaoRegra) return item.manutencaoRegra;
    const unit =
      item.prazoUnidade === "dias" ? "dias" : item.prazoUnidade === "semanas" ? "semanas" : "meses";
    return `${item.prazoManutencao} ${unit}`;
  }

  function catalogPrices(item) {
    const normal = `
      <div class="svc-price-block">
        <p class="svc-price-kicker">Atendimento normal</p>
        <p>Pix/Dinheiro: ${esc(priceLabel(item, item.valorPix != null ? item.valorPix : item.valorReferencia))}</p>
        <p>Cartão: ${esc(priceLabel(item, item.valorCartao != null ? item.valorCartao : item.valorReferencia))}</p>
      </div>`;
    if (!item.exigeManutencao) return normal;
    const regra = prazoLabel(item);
    return (
      normal +
      `<div class="svc-price-block">
        <p class="svc-price-kicker">Manutenção${regra ? ` — ${esc(regra)}` : ""}</p>
        <p>Pix/Dinheiro: ${esc(priceLabel(item, item.valorPixManutencao))}</p>
        <p>Cartão: ${esc(priceLabel(item, item.valorCartaoManutencao))}</p>
      </div>`
    );
  }

  function render() {
    renderCats();
    const items = filtered();
    if (!items.length) {
      root.innerHTML = `<p class="empty">Nenhum serviço encontrado.</p>`;
      return;
    }
    const catsOrder = categories();
    const grouped = {};
    items.forEach((item) => {
      const cat = item.categoria || "Outros";
      const sub = item.subgrupo || "Outros";
      if (!grouped[cat]) grouped[cat] = {};
      if (!grouped[cat][sub]) grouped[cat][sub] = [];
      grouped[cat][sub].push(item);
    });
    const orderFor = (cat) => {
      const defaults = window.StudioState.subgroupsFor(cat) || [];
      const keys = Object.keys(grouped[cat] || {});
      return defaults.filter((name) => keys.indexOf(name) >= 0).concat(keys.filter((name) => defaults.indexOf(name) < 0));
    };
    root.innerHTML = catsOrder
      .map((cat) => {
        const subs = grouped[cat];
        if (!subs) return "";
        const blocks = orderFor(cat)
          .map((sub) => {
            const cards = (subs[sub] || [])
              .map((item) => {
                const pros = item.profissionaisHabilitadas || [];
                const proLine = pros.length
                  ? esc(pros.join(" · "))
                  : `<span class="svc-card-warn">Nenhuma profissional configurada</span>`;
                return `
                  <article class="card service-card svc-catalog-card ${item.ativo ? "" : "is-inactive"}" data-service-id="${esc(item.id)}" tabindex="0" role="button">
                    <div class="svc-catalog-head">
                      <h3 class="svc-card-name">${esc(item.nome)}</h3>
                      <button class="btn btn--ghost svc-card-edit" type="button" data-service-id="${esc(item.id)}">Editar</button>
                    </div>
                    <p class="svc-card-meta">${esc(item.categoria || "Serviço")} · ${proLine}</p>
                    ${catalogPrices(item)}
                    <p class="svc-catalog-stats">
                      <span class="svc-catalog-dur">${esc(item.duracaoMinutos || 60)} min</span>
                    </p>
                    ${statusMarkup(item.ativo)}
                  </article>
                `;
              })
              .join("");
            return `<div class="svc-subgroup"><h3 class="svc-sub-title">${esc(sub)}</h3><div class="service-grid svc-catalog-grid">${cards}</div></div>`;
          })
          .join("");
        return `<section class="svc-category"><h2 class="svc-cat-title">${esc(cat).toUpperCase()}</h2>${blocks}</section>`;
      })
      .join("");
  }

  function openModal() {
    modal.classList.add("is-open");
  }

  function closeModal() {
    closeTax();
    modal.classList.remove("is-open");
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  }

  function closeConfirm() {
    confirmModal.classList.remove("is-open");
  }

  const taxModal = document.getElementById("modal-svc-tax");
  const taxForm = document.getElementById("tax-form");
  const taxTitle = document.getElementById("tax-title");
  const taxLabel = document.getElementById("tax-label");
  const taxName = document.getElementById("tax-name");
  const taxError = document.getElementById("tax-error");
  const taxCatView = document.getElementById("tax-cat-view");
  const taxSave = document.getElementById("tax-save");
  const taxField = document.getElementById("field-tax-name");
  let taxMode = "categoria";

  function closeTax() {
    if (taxModal) taxModal.classList.remove("is-open");
    if (taxField) taxField.classList.remove("is-invalid");
  }

  function openTax(mode) {
    taxMode = mode;
    if (mode === "subgrupo" && !fieldCategoria.value) {
      markField("field-svc-categoria", true);
      window.toast("Selecione a categoria primeiro.");
      return;
    }
    if (taxTitle) taxTitle.textContent = mode === "subgrupo" ? "Novo subgrupo" : "Nova categoria";
    if (taxLabel) taxLabel.textContent = mode === "subgrupo" ? "Nome do subgrupo" : "Nome da categoria";
    if (taxSave) taxSave.textContent = mode === "subgrupo" ? "Criar subgrupo" : "Criar categoria";
    if (taxName) taxName.value = "";
    if (taxField) taxField.classList.remove("is-invalid");
    if (taxCatView) {
      if (mode === "subgrupo") {
        taxCatView.hidden = false;
        taxCatView.textContent = "Categoria: " + fieldCategoria.value;
      } else {
        taxCatView.hidden = true;
        taxCatView.textContent = "";
      }
    }
    if (taxModal) taxModal.classList.add("is-open");
    window.setTimeout(() => taxName && taxName.focus(), 40);
  }

  function saveTax() {
    if (taxField) taxField.classList.remove("is-invalid");
    const result =
      taxMode === "subgrupo"
        ? window.StudioState.addSubgroup(fieldCategoria.value, taxName.value)
        : window.StudioState.addCategory(taxName.value);
    if (!result || !result.ok) {
      if (taxField) taxField.classList.add("is-invalid");
      if (taxError) taxError.textContent = (result && result.error) || "Não foi possível criar.";
      taxName.focus();
      return;
    }
    closeTax();
    if (taxMode === "categoria") {
      fillCategories(result.nome);
      fillSubgroups(result.nome, "");
    } else {
      fillSubgroups(fieldCategoria.value, result.nome);
    }
    renderCats();
    window.toast(taxMode === "categoria" ? "Categoria criada." : "Subgrupo criado.");
  }

  function syncExigeUi() {
    if (exigeBox) exigeBox.checked = exigeManutencao;
    if (maintFields) maintFields.hidden = !exigeManutencao;
  }

  function syncStatusUi() {
    statusLabel.innerHTML = statusMarkup(editingAtivo);
    if (mode === "edit") {
      toggleActive.textContent = editingAtivo ? "Inativar serviço" : "Ativar serviço";
      toggleActive.hidden = false;
      deleteBtn.hidden = false;
      editActions.hidden = false;
    } else {
      toggleActive.hidden = true;
      deleteBtn.hidden = true;
      editActions.hidden = true;
    }
  }

  function openCreate() {
    mode = "create";
    editingId = "";
    editingAtivo = true;
    title.textContent = "Novo serviço";
    submitBtn.textContent = "Salvar serviço";
    fieldNome.value = "";
    fillCategories("Unhas");
    fillSubgroups("Unhas", "Mãos e pés");
    if (fieldPix) fieldPix.value = "";
    if (fieldCartao) fieldCartao.value = "";
    if (fieldDuracao) fieldDuracao.value = "30";
    fieldTipo.value = "fixo";
    if (fieldUnidade) fieldUnidade.value = "";
    fieldObs.value = "";
    exigeManutencao = false;
    if (fieldPrazo) fieldPrazo.value = "";
    if (fieldPrazoUnidade) fieldPrazoUnidade.value = "dias";
    if (fieldRegra) fieldRegra.value = "";
    if (fieldPixMaint) fieldPixMaint.value = "";
    if (fieldCartaoMaint) fieldCartaoMaint.value = "";
    renderPros([]);
    syncExigeUi();
    syncStatusUi();
    openModal();
    window.setTimeout(() => fieldNome.focus(), 40);
  }

  function openEdit(id) {
    const item = window.StudioState.service(id);
    if (!item) return;
    mode = "edit";
    editingId = item.id;
    editingAtivo = item.ativo !== false;
    title.textContent = "Editar serviço";
    submitBtn.textContent = "Salvar alterações";
    fieldNome.value = item.nome;
    fillCategories(item.categoria);
    fillSubgroups(item.categoria, item.subgrupo);
    if (fieldPix) fieldPix.value = window.textoMoedaInput(item.valorPix != null ? item.valorPix : item.valorReferencia);
    if (fieldCartao) fieldCartao.value = window.textoMoedaInput(item.valorCartao != null ? item.valorCartao : item.valorReferencia);
    if (fieldDuracao) fieldDuracao.value = String(item.duracaoMinutos || 30);
    fieldTipo.value = item.tipoPreco === "a_partir_de" ? "a_partir_de" : "fixo";
    if (fieldUnidade) fieldUnidade.value = item.unidadePreco === "por unha" ? "por unha" : "";
    fieldObs.value = item.observacoes || "";
    exigeManutencao = item.exigeManutencao === true;
    if (fieldPrazo) fieldPrazo.value = item.prazoManutencao ? String(item.prazoManutencao) : "";
    if (fieldPrazoUnidade) fieldPrazoUnidade.value = item.prazoUnidade || "dias";
    if (fieldRegra) fieldRegra.value = item.manutencaoRegra || "";
    if (fieldPixMaint) fieldPixMaint.value = exigeManutencao ? window.textoMoedaInput(item.valorPixManutencao) : "";
    if (fieldCartaoMaint) fieldCartaoMaint.value = exigeManutencao ? window.textoMoedaInput(item.valorCartaoManutencao) : "";
    renderPros(item.profissionaisHabilitadas);
    syncExigeUi();
    syncStatusUi();
    openModal();
  }

  function payload() {
    return {
      id: editingId || undefined,
      nome: fieldNome.value.trim(),
      categoria: fieldCategoria.value,
      subgrupo: fieldSubgrupo.value,
      valorPix: parseMoneyField(fieldPix).value,
      valorCartao: parseMoneyField(fieldCartao).value,
      valorReferencia: parseMoneyField(fieldPix).value,
      duracaoMinutos: parseDuracao().value,
      tipoPreco: fieldTipo.value === "a_partir_de" ? "a_partir_de" : "fixo",
      unidadePreco: fieldUnidade && fieldUnidade.value === "por unha" ? "por unha" : "",
      profissionaisHabilitadas: selectedPros(),
      observacoes: fieldObs.value.trim(),
      exigeManutencao,
      prazoManutencao: Number(fieldPrazo && fieldPrazo.value) || 0,
      prazoUnidade: fieldPrazoUnidade ? fieldPrazoUnidade.value : "dias",
      manutencaoRegra: fieldRegra ? fieldRegra.value.trim() : "",
      valorPixManutencao: exigeManutencao ? parseMoneyField(fieldPixMaint).value : 0,
      valorCartaoManutencao: exigeManutencao ? parseMoneyField(fieldCartaoMaint).value : 0,
      servicoManutencaoId: exigeManutencao ? editingId || "" : "",
      ativo: editingAtivo
    };
  }

  function validate() {
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    let first = null;
    if (!fieldNome.value.trim()) {
      markField("field-svc-nome", true);
      first = first || fieldNome;
    }
    if (!fieldCategoria.value) {
      markField("field-svc-categoria", true);
      first = first || fieldCategoria;
    }
    if (!fieldSubgrupo.value) {
      markField("field-svc-subgrupo", true);
      first = first || fieldSubgrupo;
    }
    if (!parseMoneyField(fieldPix).ok) {
      markField("field-svc-pix", true);
      first = first || fieldPix;
    }
    if (!parseMoneyField(fieldCartao).ok) {
      markField("field-svc-cartao", true);
      first = first || fieldCartao;
    }
    if (!parseDuracao().ok) {
      markField("field-svc-duracao", true);
      first = first || fieldDuracao;
    }
    if (exigeManutencao && (!fieldPrazo || !Number(fieldPrazo.value))) {
      if (fieldPrazo) fieldPrazo.focus();
      first = first || fieldPrazo;
    }
    if (exigeManutencao && !parseMoneyField(fieldPixMaint).ok) {
      markField("field-svc-pix-maint", true);
      first = first || fieldPixMaint;
    }
    if (exigeManutencao && !parseMoneyField(fieldCartaoMaint).ok) {
      markField("field-svc-cartao-maint", true);
      first = first || fieldCartaoMaint;
    }
    if (first) {
      first.focus();
      return false;
    }
    return true;
  }

  function save() {
    if (!validate()) return;
    const saved = window.StudioState.saveService(payload());
    if (!saved) return;
    closeModal();
    render();
    window.toast(mode === "edit" ? "Serviço atualizado com sucesso." : "Serviço criado com sucesso.");
  }

  function openDeleteConfirm() {
    const item = window.StudioState.service(editingId);
    if (!item) return;
    const used = window.StudioState.serviceUsed(item.id);
    confirmExtra.textContent = used
      ? "Este serviço já foi utilizado em atendimentos e possui histórico. Recomendamos inativá-lo para preservar os dados."
      : "Essa ação removerá o serviço do catálogo. O histórico existente não será apagado.";
    confirmText.textContent = used
      ? "A exclusão não está disponível porque este serviço já faz parte de atendimentos."
      : "";
    confirmDeactivate.hidden = false;
    confirmDeactivate.textContent = "Inativar serviço";
    confirmDelete.hidden = used;
    confirmModal.classList.add("is-open");
  }

  if (!root || !form) return;

  fillCategories("Unhas");
  renderPros([]);
  fillSubgroups("Unhas", "Mãos e pés");
  render();

  newBtn.addEventListener("click", openCreate);
  search.addEventListener("input", render);
  statusFilter.addEventListener("change", render);
  cats.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-svc-cat]");
    if (!btn) return;
    categoryFilter = btn.dataset.svcCat;
    render();
  });

  root.addEventListener("click", (event) => {
    const card = event.target.closest("[data-service-id]");
    if (!card) return;
    openEdit(card.dataset.serviceId);
  });
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest("[data-service-id]");
    if (!card) return;
    event.preventDefault();
    openEdit(card.dataset.serviceId);
  });

  fieldCategoria.addEventListener("change", () => {
    fillSubgroups(fieldCategoria.value, "");
  });
  exigeBox?.addEventListener("change", () => {
    exigeManutencao = Boolean(exigeBox.checked);
    if (exigeManutencao && fieldPrazo && !fieldPrazo.value) fieldPrazo.value = "15";
    if (exigeManutencao && fieldPrazoUnidade && !fieldPrazoUnidade.value) fieldPrazoUnidade.value = "dias";
    syncExigeUi();
  });
  fieldPros.addEventListener("change", updateProWarn);
  [fieldPix, fieldCartao, fieldPixMaint, fieldCartaoMaint].forEach((input) => {
    if (!input) return;
    input.addEventListener("blur", () => {
      const parsed = parseMoneyField(input);
      if (parsed.ok) input.value = window.textoMoedaInput(parsed.value);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    save();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close-service]")) closeModal();
  });

  toggleActive.addEventListener("click", () => {
    if (mode !== "edit" || !editingId) return;
    editingAtivo = !editingAtivo;
    window.StudioState.setServiceActive(editingId, editingAtivo);
    syncStatusUi();
    render();
    window.toast(editingAtivo ? "Serviço ativado." : "Serviço inativado.");
  });

  deleteBtn.addEventListener("click", openDeleteConfirm);

  confirmModal.addEventListener("click", (event) => {
    if (event.target === confirmModal || event.target.closest("[data-close-confirm]")) {
      closeConfirm();
    }
  });

  confirmDeactivate.addEventListener("click", () => {
    if (!editingId) return;
    editingAtivo = false;
    window.StudioState.setServiceActive(editingId, false);
    closeConfirm();
    syncStatusUi();
    render();
    window.toast("Serviço inativado.");
  });

  confirmDelete.addEventListener("click", () => {
    if (!editingId) return;
    const removed = window.StudioState.deleteService(editingId);
    closeConfirm();
    if (!removed) {
      window.toast("Este serviço possui histórico. Inative-o para preservar os dados.");
      return;
    }
    closeModal();
    render();
    window.toast("Serviço excluído.");
  });

  document.getElementById("svc-add-cat")?.addEventListener("click", () => openTax("categoria"));
  document.getElementById("svc-add-sub")?.addEventListener("click", () => openTax("subgrupo"));
  taxForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTax();
  });
  taxModal?.addEventListener("click", (event) => {
    if (event.target === taxModal || event.target.closest("[data-close-tax]")) closeTax();
  });

  document.addEventListener("services:changed", () => {
    if (!modal.classList.contains("is-open")) render();
  });
  document.addEventListener("catalog:changed", () => {
    if (modal.classList.contains("is-open")) {
      const cat = fieldCategoria.value;
      const sub = fieldSubgrupo.value;
      fillCategories(cat);
      fillSubgroups(fieldCategoria.value, sub);
    }
    renderCats();
  });
})();
