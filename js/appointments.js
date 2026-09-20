(function () {
  function ensureModals() {
    if (document.getElementById("modal-detail")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="modal-backdrop" id="modal-detail">
        <div class="modal modal--wide" role="dialog" aria-labelledby="detail-title">
          <p class="kicker">Agendamento</p>
          <h2 class="modal-title" id="detail-title">Detalhes do agendamento</h2>
          <div id="detail-body" class="stack" style="margin-top:16px"></div>
          <div class="stack" style="margin-top:18px">
            <button class="btn btn--primary" data-detail="edit" type="button">Editar</button>
            <button class="btn btn--secondary" data-detail="done" type="button">Marcar como concluído</button>
            <button class="btn btn--danger" data-detail="cancel" type="button">Cancelar atendimento</button>
            <button class="btn btn--secondary" data-close="modal-detail" type="button">Fechar</button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop modal-backdrop--over" id="modal-cancel">
        <div class="modal" role="dialog" aria-labelledby="cancel-title">
          <p class="kicker">Confirmação</p>
          <h2 class="modal-title" id="cancel-title">Cancelar atendimento?</h2>
          <p class="hint" style="margin-top:10px">O registro permanece no histórico, com o status Cancelado. Nada será excluído.</p>
          <div class="btn-row" style="margin-top:18px; justify-content:flex-end">
            <button class="btn btn--secondary" data-close="modal-cancel" type="button">Manter agendamento</button>
            <button class="btn btn--danger" data-confirm-cancel type="button">Cancelar atendimento</button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop" id="modal-message">
        <div class="modal">
          <h2 class="modal-title" id="message-title"></h2>
          <p class="hint" id="message-text" style="margin-top:10px"></p>
          <div class="btn-row" style="margin-top:18px; justify-content:flex-end">
            <button class="btn btn--primary" data-close="modal-message" type="button">Fechar</button>
          </div>
        </div>
      </div>
      `
    );
  }

  function openModal(id) {
    document.getElementById(id).classList.add("is-open");
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("is-open");
  }

  function priceLabel(line) {
    const text = window.formatMoney(line.valorReferencia);
    const prefix = line.fromPrice ? "A partir de " : "";
    const suffix = line.unidadePreco === "por unha" ? " por unha" : "";
    return prefix + text + suffix;
  }

  function renderDetail(appt) {
    const api = window.StudioAvailability;
    const timeline = api && typeof api.serviceTimeline === "function" ? api.serviceTimeline(appt) : [];
    const end = api && typeof api.calculateAppointmentEnd === "function" ? api.calculateAppointmentEnd(appt) : "";
    const occupancy = (api && typeof api.getProfessionalOccupancy === "function" ? api.getProfessionalOccupancy(appt) : [])
      .map(
        (item) =>
          `<p class="hint">${item.profissional}: ${api.minutesToTime(item.start)} → ${api.minutesToTime(item.end)} · ${item.duracaoMinutos} min</p>`
      )
      .join("");
    const schedule = `
      <div class="appt-time">${appt.dateLabel}<br>${appt.time}${end ? ` → ${end}` : ""}</div>
      ${occupancy || ""}
    `;
    const services = (appt.servicos || [])
      .map(
        (line, index) => `
        <article class="svc-card svc-card--detail">
          <div class="svc-card-top">
            <div>
              <h3 class="svc-name">${line.nome}</h3>
              <span class="svc-cat">${line.categoria || "Serviço"}</span>
            </div>
            <div class="svc-card-side">
              <strong class="svc-price">${priceLabel(line)}</strong>
              ${line.fromPrice ? `<span class="svc-ref">Valor de referência</span>` : ""}
            </div>
          </div>
          <p class="svc-pro-fixed"><span class="form-label">Profissional</span><br><strong>${line.profissional || "—"}</strong></p>
          ${
            timeline[index]
              ? `<p class="hint">${timeline[index].inicio} → ${timeline[index].fim} · ${timeline[index].duracaoMinutos} min</p>`
              : ""
          }
        </article>
      `
      )
      .join("");
    const extraNote = appt.motivoValorExtra
      ? `<p class="hint">${appt.motivoValorExtra}</p>`
      : "";
    document.getElementById("detail-body").innerHTML = `
      <a class="profile-name" href="clientes.html?cliente=${appt.clientId}">♡  ${appt.client}</a>
      ${schedule}
      <div class="svc-list">${services || `<p class="empty">Nenhum serviço neste agendamento.</p>`}</div>
      <div class="totals-box">
        <div class="totals-row"><span>Valor dos serviços</span><strong>${window.formatMoney(appt.subtotalServicos || 0)}</strong></div>
        <div class="totals-row"><span>Valor extra</span><strong>${window.formatMoney(appt.valorExtra || 0)}</strong></div>
        ${extraNote}
        <div class="totals-row totals-row--total"><span>Total</span><strong>${window.formatMoney(appt.valorTotal || appt.valor || 0)}</strong></div>
      </div>
      <div class="field"><span class="form-label">Status</span><span class="${window.badgeClass(appt.status)}">${window.statusLabel(appt.status)}</span></div>
      <div class="field"><span class="form-label">Observações</span><strong>${appt.notes || "—"}</strong></div>
    `;
    const cancelBtn = document.querySelector('[data-detail="cancel"]');
    const doneBtn = document.querySelector('[data-detail="done"]');
    cancelBtn.disabled = appt.status === "cancelado";
    if (doneBtn) {
      doneBtn.hidden = appt.status === "concluido" || appt.status === "cancelado";
    }
  }

  function refreshCards() {
    document.querySelectorAll(".appt-card[data-appt]").forEach((card) => {
      const appt = window.StudioState.appointment(card.dataset.appt);
      if (!appt) return;
      const badge = card.querySelector(".badge");
      if (badge) {
        badge.className = window.badgeClass(appt.status);
        badge.textContent = window.statusLabel(appt.status);
      }
      const price = card.querySelector(".appt-price");
      if (price) price.textContent = appt.price;
      const meta = card.querySelector(".appt-meta");
      if (meta) {
        meta.textContent = `${appt.service || "Serviços a definir"}  ·  ${appt.professional || "Profissional a definir"}`;
      }
      const time = card.querySelector(".appt-time");
      const timeNode = time && time.childNodes[0];
      if (timeNode) timeNode.textContent = appt.time;
      const date = card.querySelector(".appt-date");
      if (date) date.textContent = appt.dateShort;
    });
  }

  window.openAppointment = function (id) {
    ensureModals();
    const appt = window.StudioState.appointment(id);
    if (!appt) return;
    window.__openApptId = id;
    renderDetail(appt);
    openModal("modal-detail");
  };

  window.showMessage = function (title, text) {
    ensureModals();
    document.getElementById("message-title").textContent = title;
    document.getElementById("message-text").textContent = text;
    openModal("modal-message");
  };

  document.addEventListener("click", (event) => {
    ensureModals();
    const closeId = event.target.closest("[data-close]")?.dataset.close;
    if (closeId) closeModal(closeId);

    if (event.target.closest("[data-open-new-appt]")) return;

    if (event.target.closest(".modal-backdrop") === event.target) {
      event.target.classList.remove("is-open");
    }

    const nameLink = event.target.closest(".appt-name");
    if (nameLink) return;
    if (event.target.closest("[data-sort], [data-return-history]")) return;

    const card = event.target.closest("[data-appt]");
    if (card && !event.target.closest(".composer") && !event.target.closest(".svc-sheet")) {
      event.preventDefault();
      window.openAppointment(card.dataset.appt);
    }

    if (event.target.closest('[data-detail="edit"]')) {
      const id = window.__openApptId;
      closeModal("modal-detail");
      if (typeof window.openNewAppointment === "function") {
        window.openNewAppointment({ appointmentId: id, origin: document.body.dataset.page });
      }
    }

    if (event.target.closest('[data-detail="done"]')) {
      window.StudioState.setStatus(window.__openApptId, "concluido");
      renderDetail(window.StudioState.appointment(window.__openApptId));
      refreshCards();
      window.toast("Atendimento concluído.");
    }

    if (event.target.closest('[data-detail="cancel"]')) {
      openModal("modal-cancel");
    }

    if (event.target.closest("[data-confirm-cancel]")) {
      window.StudioState.setStatus(window.__openApptId, "cancelado");
      closeModal("modal-cancel");
      renderDetail(window.StudioState.appointment(window.__openApptId));
      refreshCards();
      window.toast("Atendimento marcado como cancelado.");
    }
  });

  document.addEventListener("appointments:changed", refreshCards);

  document.addEventListener("DOMContentLoaded", () => {
    ensureModals();
  });
})();
