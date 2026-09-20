(function () {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  document.querySelectorAll("[data-greeting]").forEach((el) => {
    el.textContent = `${greeting}.`;
  });

  const TODAY = window.StudioState.today;
  const period = document.getElementById("period-select");
  const custom = document.getElementById("period-custom");
  const hint = document.getElementById("period-hint");
  const fromInput = document.getElementById("period-from");
  const toInput = document.getElementById("period-to");

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

  function addMonths(iso, amount) {
    const date = fromIso(iso);
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + amount);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, last));
    return toIso(date);
  }

  function monthBounds(iso) {
    const date = fromIso(iso);
    const start = toIso(new Date(date.getFullYear(), date.getMonth(), 1));
    const end = toIso(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    return { start, end };
  }

  (function setCustomPeriodDefaults() {
    const bounds = monthBounds(TODAY);
    if (fromInput && !fromInput.value) fromInput.value = bounds.start;
    if (toInput && !toInput.value) toInput.value = bounds.end;
  })();

  function weekBounds(iso) {
    const date = fromIso(iso);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return { start: toIso(start), end: toIso(end) };
  }

  function periodRange() {
    const value = period ? period.value : "mes-atual";
    if (value === "hoje") return { start: TODAY, end: TODAY };
    if (value === "esta-semana") return weekBounds(TODAY);
    if (value === "mes-atual") return monthBounds(TODAY);
    if (value === "proximo-mes") return monthBounds(addMonths(TODAY, 1));
    return {
      start: fromInput && fromInput.value ? fromInput.value : TODAY,
      end: toInput && toInput.value ? toInput.value : TODAY
    };
  }

  function periodLabel() {
    const range = periodRange();
    const option = period ? period.options[period.selectedIndex].text : "Mês atual";
    return `${option}: ${window.displayDate(range.start)} a ${window.displayDate(range.end)}`;
  }

  function inRange(item, range) {
    return item.date >= range.start && item.date <= range.end;
  }

  function money(value) {
    return window.formatMoney(value);
  }

  function renderMetrics() {
    const range = periodRange();
    if (range.start > range.end) {
      if (hint) hint.textContent = "Informe um período válido. A data inicial precisa ser anterior à final.";
      return;
    }
    const rows = window.StudioState.list().filter((item) => inRange(item, range));
    const done = rows.filter((item) => item.status === "concluido");
    const planned = rows.filter((item) => item.status === "agendado" || item.status === "confirmado");
    const active = rows.filter((item) => item.status !== "cancelado");
    const realized = done.reduce((sum, item) => sum + (item.valorTotal || item.valor || 0), 0);
    const forecast = planned.reduce((sum, item) => sum + (item.valorTotal || item.valor || 0), 0);
    const clients = new Set(active.map((item) => item.clientId)).size;
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    setText("metric-realized", money(realized));
    setText("metric-forecast", money(forecast));
    setText("metric-projection", money(realized + forecast));
    setText("stat-clients", String(clients));
    setText("stat-appts", String(active.length));
    if (hint) hint.textContent = periodLabel();

    const byPro = { Bruna: { realized: 0, forecast: 0 }, Amanda: { realized: 0, forecast: 0 } };
    const countByService = {};
    active.forEach((item) => {
      const bucket = item.status === "concluido" ? "realized" : "forecast";
      (item.servicos || []).forEach((line) => {
        const name = line.profissional;
        const value = Number(line.valorReferencia) || 0;
        if (byPro[name]) byPro[name][bucket] += value;
        if (line.nome) countByService[line.nome] = (countByService[line.nome] || 0) + 1;
      });
    });
    const maxBar = Math.max(
      byPro.Bruna.realized,
      byPro.Bruna.forecast,
      byPro.Amanda.realized,
      byPro.Amanda.forecast,
      1
    );
    function fillBar(id, value) {
      const el = document.getElementById(id);
      if (el) el.style.width = `${Math.round((value / maxBar) * 100)}%`;
    }
    function fillValue(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = money(value);
    }
    fillBar("chart-bruna-real-bar", byPro.Bruna.realized);
    fillBar("chart-bruna-prev-bar", byPro.Bruna.forecast);
    fillBar("chart-amanda-real-bar", byPro.Amanda.realized);
    fillBar("chart-amanda-prev-bar", byPro.Amanda.forecast);
    fillValue("chart-bruna-real", byPro.Bruna.realized);
    fillValue("chart-bruna-prev", byPro.Bruna.forecast);
    fillValue("chart-amanda-real", byPro.Amanda.realized);
    fillValue("chart-amanda-prev", byPro.Amanda.forecast);

    const top = Object.entries(countByService).sort((a, b) => b[1] - a[1])[0];
    const proc = document.getElementById("dashboard-top-service");
    if (proc) {
      proc.textContent = top ? `${top[0]} · ${top[1]}x` : "Nenhum atendimento no período";
    }
  }

  function compactApptLine(item) {
    const svc = (item.servicos || []).map((line) => line.nome).filter(Boolean).join(" · ") || item.service || "Serviço";
    const pro = item.professional || (item.servicos || []).map((line) => line.profissional).filter(Boolean)[0] || "";
    const when = item.date === TODAY ? item.time : `${window.displayDate(item.date)} · ${item.time}`;
    return `
      <button class="dash-appt-line" type="button" data-open-appt="${item.id}">
        <strong>${when}</strong>
        <span>${item.client} — ${svc}${pro ? ` — ${pro}` : ""}</span>
      </button>
    `;
  }

  function renderDashboardAppointments() {
    const host = document.getElementById("dashboard-upcoming");
    if (!host || !window.StudioState) return;
    const range = periodRange();
    const rows = window.StudioState.list()
      .filter((item) => item.status === "agendado" || item.status === "confirmado")
      .filter((item) => item.date >= range.start && item.date <= range.end)
      .filter((item) => item.date >= TODAY)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 4);
    host.innerHTML = rows.length
      ? rows.map(compactApptLine).join("")
      : `<p class="empty">Nenhum atendimento neste período.</p>`;
    const next = window.StudioState.upcoming()[0];
    const nextBox = document.getElementById("dashboard-next");
    const nextText = document.getElementById("dashboard-next-text");
    if (!nextBox || !nextText) return;
    if (!next) {
      nextBox.removeAttribute("data-appt");
      nextText.textContent = "Nenhum horário à frente";
      return;
    }
    nextBox.setAttribute("data-appt", next.id);
    nextBox.style.cursor = "pointer";
    nextText.textContent = `${next.time} · ${next.client} · ${window.formatLongDate(next.date)}`;
  }

  function returnHref(view) {
    const range = periodRange();
    const params = new URLSearchParams({ view, from: range.start, to: range.end });
    const query = params.toString();
    return "retornos.html?" + query + "#" + query;
  }

  function renderReturnCards() {
    const host = document.getElementById("dash-return-cards");
    if (!host) return;
    const range = periodRange();
    const stats =
      window.StudioMaintenance && typeof window.StudioMaintenance.dashboardStats === "function"
        ? window.StudioMaintenance.dashboardStats(range)
        : { vencidas: 0, proximos: 0, semContato: 0, aguardando: 0 };
    const cards = [
      {
        view: "vencida",
        value: stats.vencidas,
        title: "Manutenções vencidas",
        hint: "Já passaram do prazo"
      },
      {
        view: "proxima",
        value: stats.proximos,
        title: "Próximos retornos",
        hint: "Previstos neste período"
      },
      {
        view: "sem_contato",
        value: stats.semContato,
        title: "Sem contato",
        hint: "Ainda precisam ser contatados"
      },
      {
        view: "aguardando",
        value: stats.aguardando,
        title: "Aguardando retorno",
        hint: "Clientes que disseram que vão retornar"
      }
    ];
    host.innerHTML = cards
      .map((card) => {
        const label = card.value === 1 ? "1 cliente" : `${card.value} clientes`;
        return `
          <a class="card dash-return-card" href="${returnHref(card.view)}">
            <strong class="stat-value">${card.value}</strong>
            <span class="kicker">${card.title}</span>
            <p class="hint">${label}. ${card.hint}</p>
            <span class="dash-return-go">Ver retornos →</span>
          </a>
        `;
      })
      .join("");
    if (!host.dataset.navBound) {
      host.dataset.navBound = "1";
      host.addEventListener("click", (event) => {
        const link = event.target.closest("a.dash-return-card");
        if (!link) return;
        try {
          const href = new URL(link.href, window.location.href);
          const params = href.searchParams;
          const hash = new URLSearchParams((href.hash || "").replace(/^#/, ""));
          sessionStorage.setItem(
            "studioElegancy_returnNav",
            JSON.stringify({
              view: params.get("view") || hash.get("view") || "",
              from: params.get("from") || hash.get("from") || "",
              to: params.get("to") || hash.get("to") || ""
            })
          );
        } catch (error) {
          /* ignore */
        }
      });
    }
  }

  function refresh() {
    renderMetrics();
    renderDashboardAppointments();
    renderReturnCards();
  }

  if (period) {
    period.addEventListener("change", () => {
      if (custom) custom.hidden = period.value !== "personalizado";
      refresh();
    });
  }
  fromInput?.addEventListener("change", refresh);
  toInput?.addEventListener("change", refresh);

  document.getElementById("dashboard-upcoming")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-open-appt]");
    if (!btn) return;
    window.openAppointment(btn.dataset.openAppt);
  });

  refresh();
  document.addEventListener("appointments:changed", refresh);
  document.addEventListener("clients:changed", refresh);
  document.addEventListener("manutencoes:changed", refresh);
})();
