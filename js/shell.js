(function () {
  const page = document.body.dataset.page || "";
  if (document.body.dataset.shell === "off") return;
  const icon = (d) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

  const icons = {
    inicio:
      icon('<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>'),
    agenda:
      icon('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
    clientes:
      icon('<circle cx="9" cy="8" r="3"/><path d="M4 19a5 5 0 0 1 10 0"/><circle cx="17" cy="9" r="2.2"/><path d="M16 19a4 4 0 0 1 4-3"/>'),
    servicos:
      icon('<path d="M8 4h8l2 4H6zM6 8v12h12V8"/><path d="M10 12h4"/>'),
    relatorios:
      icon('<path d="M5 19V9M10 19V5M15 19v-7M20 19V8"/>'),
    retornos:
      icon('<path d="M7 8h8V5l5 5.5L15 16v-3H8a4 4 0 1 0 0 8h3v2H8a6 6 0 1 1 0-12z"/>'),
    config:
      icon('<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4 6.2 17.8"/>')
  };

  const item = (key, href, label, extra = "") =>
    `<a class="nav-link ${extra}" data-page="${key}" href="${href}">${icons[key] || icons.config}<span>${label}</span></a>`;

  const sidebar = `
    <aside class="sidebar">
      <div class="brand-heart">♡</div>
      <div class="brand-studio">STUDIO</div>
      <div class="brand-name">ELEGANCY</div>
      <div class="brand-slogan">Beleza que te representa.</div>
      <div class="sidebar-rule"></div>
      <nav class="nav">
        ${item("inicio", "index.html", "Início")}
        ${item("agenda", "agenda.html", "Agenda")}
        ${item("retornos", "retornos.html", "Retornos")}
        ${item("clientes", "clientes.html", "Clientes")}
        ${item("servicos", "servicos.html", "Serviços")}
        ${item("relatorios", "relatorios.html", "Relatórios")}
      </nav>
      <div class="nav-spacer"></div>
      <div class="sidebar-rule"></div>
      <nav class="nav">
        ${item("configuracoes", "configuracoes.html", "Configurações")}
      </nav>
    </aside>
  `;

  const shell = document.createElement("div");
  shell.className = "shell";
  shell.innerHTML = sidebar;
  const main = document.querySelector("main.content");
  document.body.prepend(shell);
  if (main) shell.appendChild(main);

  document.querySelectorAll(".nav-link").forEach((link) => {
    if (link.dataset.page === page) link.classList.add("is-active");
  });
})();
