(function () {
  function ensureClientModal() {
    if (document.getElementById("modal-client")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="modal-backdrop modal-backdrop--over" id="modal-client">
        <div class="modal modal--client" role="dialog" aria-labelledby="client-form-title">
          <p class="kicker" id="client-form-kicker">Cadastro</p>
          <h2 class="modal-title" id="client-form-title">Nova cliente</h2>
          <form class="form-grid client-form" id="client-form">
            <div class="client-ana-box" id="client-ana-box" hidden>
              <span class="kicker">Anamnese</span>
              <p>Complete a ficha de anamnese desta cliente.</p>
              <p class="hint" id="client-ana-status">Anamnese pendente</p>
              <button class="btn btn--primary" type="button" id="client-ana-open">+ Preencher anamnese</button>
            </div>
            <div class="field" data-required>
              <label for="client-name">Nome *</label>
              <input class="input" id="client-name" name="name" autocomplete="name" placeholder="Nome da cliente">
              <span class="field-error">Informe o nome da cliente.</span>
            </div>
            <div class="field">
              <label for="client-doc">CPF / Documento</label>
              <input class="input" id="client-doc" name="documento" inputmode="numeric" placeholder="000.000.000-00">
            </div>
            <div class="when-row">
              <div class="field">
                <label for="client-phone">Telefone</label>
                <input class="input" id="client-phone" name="phone" inputmode="tel" placeholder="(11) 90000-0000">
              </div>
              <div class="field">
                <label for="client-whatsapp">WhatsApp</label>
                <input class="input" id="client-whatsapp" name="whatsapp" inputmode="tel" placeholder="(11) 90000-0000">
              </div>
            </div>
            <div class="field">
              <label for="client-email">E-mail</label>
              <input class="input" id="client-email" name="email" type="email" placeholder="cliente@email.com">
            </div>
            <div class="field">
              <label for="client-birth">Data de nascimento</label>
              <input class="input" id="client-birth" name="birth" placeholder="10/05/1995">
              <p class="hint client-age-hint" id="client-age-view">A idade é calculada automaticamente.</p>
            </div>
            <div class="field">
              <label for="client-allergies">Alergias</label>
              <textarea class="textarea textarea--short" id="client-allergies" name="allergies" placeholder="Ex.: esmalte, látex, níquel. Deixe em branco se não houver."></textarea>
              <p class="hint">Registro geral do cadastro. O detalhamento por procedimento fica na anamnese.</p>
            </div>
            <div class="field">
              <label for="client-notes">Observações</label>
              <textarea class="textarea textarea--short" id="client-notes" name="notes" placeholder="Preferências, recados..."></textarea>
            </div>
            <p class="form-note">
              <span class="form-note-mark" aria-hidden="true">i</span>
              Você poderá completar o cadastro posteriormente.
            </p>
            <div class="btn-row client-form-actions">
              <button class="btn btn--secondary" type="button" data-close-client>Cancelar</button>
              <button class="btn btn--primary" type="submit" id="client-form-save">Salvar cliente</button>
            </div>
          </form>
        </div>
      </div>
      `
    );
  }

  function openModal() {
    ensureClientModal();
    document.getElementById("modal-client").classList.add("is-open");
  }

  function closeModal() {
    const el = document.getElementById("modal-client");
    if (el) el.classList.remove("is-open");
  }

  function updateAgeHint(value) {
    const view = document.getElementById("client-age-view");
    if (!view) return;
    const label = window.idadeLabel ? window.idadeLabel(value) : "";
    view.textContent = label || "A idade é calculada automaticamente pela data de nascimento.";
  }

  function fillAnamneseShortcut(client, options = {}) {
    const box = document.getElementById("client-ana-box");
    const status = document.getElementById("client-ana-status");
    const btn = document.getElementById("client-ana-open");
    if (!box || !status || !btn) return;
    if (!client || options.source === "appointment") {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const ok = Boolean(client.anamneseCompleta);
    status.hidden = ok;
    status.textContent = "Anamnese pendente";
    btn.textContent = ok ? "Ver anamnese" : "+ Preencher anamnese";
    btn.dataset.anaMode = ok ? "view" : "fill";
  }

  function fillForm(client, options = {}) {
    const form = document.getElementById("client-form");
    const nameInput = document.getElementById("client-name");
    form.dataset.id = client ? client.id : "";
    nameInput.value = client ? client.name : (options.initialName || "");
    document.getElementById("client-doc").value = client ? client.documento : "";
    document.getElementById("client-phone").value = client ? client.phone : "";
    document.getElementById("client-whatsapp").value = client ? client.whatsapp || "" : "";
    document.getElementById("client-email").value = client ? client.email : "";
    document.getElementById("client-birth").value = client ? client.birth : "";
    document.getElementById("client-allergies").value = client ? client.allergies || "" : "";
    document.getElementById("client-notes").value = client ? client.notes : "";
    form.querySelector("[data-required]").classList.remove("is-invalid");
    updateAgeHint(client ? client.birth : "");
    fillAnamneseShortcut(client, options);
    if (window.enhanceDateField) window.enhanceDateField(document.getElementById("client-birth"));
  }

  window.openClientForm = function (options = {}) {
    ensureClientModal();
    const client = options.clientId ? window.StudioState.client(options.clientId) : null;
    const editing = Boolean(client);
    document.getElementById("client-form-kicker").textContent = editing ? "Cadastro" : "Cadastro rápido";
    document.getElementById("client-form-title").textContent = editing ? "Editar cliente" : "Nova cliente";
    document.getElementById("client-form-save").textContent = editing ? "Salvar alterações" : "Salvar cliente";
    window.__clientFormOnSaved = options.onSaved || null;
    window.__clientFormSource = options.source || "";
    fillForm(client, options);
    openModal();
    window.setTimeout(() => document.getElementById("client-name").focus(), 40);
  };

  document.addEventListener("click", (event) => {
    if (!document.getElementById("modal-client")) return;
    if (event.target.closest("[data-close-client]") || event.target.id === "modal-client") {
      closeModal();
      return;
    }
    if (event.target.id === "client-ana-open") {
      if (window.__clientFormSource === "appointment") return;
      const form = document.getElementById("client-form");
      const clientId = form && form.dataset.id;
      if (!clientId) return;
      const mode = event.target.dataset.anaMode || "fill";
      closeModal();
      if (typeof window.openAnamnese === "function") {
        window.openAnamnese({
          clientId,
          mode,
          onSaved: window.__clientFormOnSaved || null
        });
      } else {
        window.location.href = `clientes.html?cliente=${encodeURIComponent(clientId)}&tab=anamnese`;
      }
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "client-birth") updateAgeHint(event.target.value);
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "client-form") return;
    event.preventDefault();
    const form = event.target;
    const nameField = form.querySelector("[data-required]");
    const nameInput = document.getElementById("client-name");
    const name = nameInput.value.trim();
    if (!name) {
      nameField.classList.add("is-invalid");
      nameInput.focus();
      return;
    }
    nameField.classList.remove("is-invalid");
    const payload = {
      name,
      documento: document.getElementById("client-doc").value.trim(),
      phone: document.getElementById("client-phone").value.trim(),
      whatsapp: document.getElementById("client-whatsapp").value.trim(),
      email: document.getElementById("client-email").value.trim(),
      birth: document.getElementById("client-birth").value.trim(),
      allergies: document.getElementById("client-allergies").value.trim(),
      notes: document.getElementById("client-notes").value.trim()
    };
    const editingId = form.dataset.id;
    const result = editingId
      ? window.StudioState.saveClient(editingId, payload)
      : window.StudioState.addClient(payload);
    if (!result || !result.client) return;
    closeModal();
    if (result.reused) {
      window.toast("Cliente já cadastrada. Selecionamos o cadastro existente.");
    } else {
      window.toast(editingId ? "Cadastro atualizado." : "✓ Cliente cadastrada com sucesso.");
    }
    if (typeof window.__clientFormOnSaved === "function") {
      window.__clientFormOnSaved(result.client);
    }
  });
})();
