(function () {
  const APPT_KEY = "studioElegancy_agendamentos";
  const CLIENT_KEY = "studioElegancy_clientes";
  const ANAMNESE_KEY = "studioElegancy_anamneses";

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function todayIso() {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }
  const MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  const CLIENT_MAIN = ["name", "documento", "phone", "email", "birth"];
  const FOOD_KEYS = [
    "studioElegancy_categorias",
    "studioElegancy_produtos",
    "studioElegancy_extras",
    "studioElegancy_pedidos"
  ];
  const MONTH_PT = {
    janeiro: "01",
    fevereiro: "02",
    marco: "03",
    março: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12"
  };
  const DEMO_BIRTH = {
    maria: "1992-03-15",
    ana: "1994-07-22",
    carla: "1988-11-10",
    juliana: "1996-01-05"
  };

  FOOD_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      /* ignore */
    }
  });

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function labelDate(iso) {
    const [year, month, day] = String(iso).split("-");
    return `${day}/${month}/${year}`;
  }

  function shortDate(iso) {
    const [year, month, day] = String(iso).split("-");
    return `${day}/${month}`;
  }

  function longDate(iso) {
    const [year, month, day] = String(iso).split("-").map(Number);
    return `${day} de ${MONTHS[month - 1]}`;
  }

  function parseDate(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const match = String(value || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    return todayIso();
  }

  function birthIso(value, clientId) {
    const text = String(value || "").trim();
    if (!text) return DEMO_BIRTH[clientId] || "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const slash = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;
    const loose = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .match(/^(\d{1,2})\s+de\s+([a-z]+)$/);
    if (loose) {
      const month = MONTH_PT[loose[2]] || MONTH_PT[text.split(" ")[2]];
      const mapped = DEMO_BIRTH[clientId];
      if (mapped) return mapped;
      if (month) return `1990-${month}-${String(loose[1]).padStart(2, "0")}`;
    }
    return DEMO_BIRTH[clientId] || "";
  }

  function calcularIdade(value, todayOverride) {
    const iso = birthIso(value);
    if (!iso) return null;
    const today = todayOverride || todayIso();
    const [year, month, day] = iso.split("-").map(Number);
    const [ty, tm, td] = today.split("-").map(Number);
    if (!year || !month || !day) return null;
    let age = ty - year;
    if (tm < month || (tm === month && td < day)) age -= 1;
    if (age < 0 || age > 130) return null;
    return age;
  }

  function idadeLabel(value) {
    const age = calcularIdade(value);
    return age == null ? "" : `${age} anos`;
  }

  function parseMoedaBR(valor) {
    if (typeof valor === "number") {
      return Number.isFinite(valor) ? valor : 0;
    }
    if (valor === null || valor === undefined || valor === "") return 0;
    let texto = String(valor).trim();
    if (!texto) return 0;
    texto = texto.replace(/R\$/gi, "").replace(/[\s\u00a0]/g, "");
    if (!texto || texto === "-" || texto === "," || texto === ".") return 0;
    const negativo = texto.startsWith("-");
    if (negativo) texto = texto.slice(1);
    if (texto.includes(",")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (texto.includes(".")) {
      const partes = texto.split(".");
      const ultima = partes[partes.length - 1];
      if (partes.length > 2 && ultima.length !== 3) return 0;
      if (partes.length > 2 || ultima.length === 3) {
        texto = texto.replace(/\./g, "");
      }
    }
    const numero = Number(texto);
    if (!Number.isFinite(numero)) return 0;
    return negativo ? -Math.abs(numero) : numero;
  }

  function formatarMoedaBR(valor) {
    const numero =
      typeof valor === "number" && Number.isFinite(valor) ? valor : parseMoedaBR(valor);
    const absoluto = Math.abs(numero);
    const [reais, centavos] = absoluto.toFixed(2).split(".");
    const agrupado = reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (numero < 0 ? "-" : "") + "R$ " + agrupado + "," + centavos;
  }

  function textoMoedaInput(valor) {
    const numero =
      typeof valor === "number" && Number.isFinite(valor) ? valor : parseMoedaBR(valor);
    if (!numero) return "";
    return numero.toFixed(2).replace(".", ",");
  }

  const parseMoney = parseMoedaBR;
  const formatMoney = formatarMoedaBR;

  function normalizeStatus(status) {
    const key = String(status || "agendado")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (key.includes("confirm")) return "confirmado";
    if (key.includes("conclu")) return "concluido";
    if (key.includes("cancel")) return "cancelado";
    return "agendado";
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function initialsFrom(name) {
    return (
      String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "•"
    );
  }

  function completenessOf(item) {
    const filled = CLIENT_MAIN.filter((key) => String(item[key] || "").trim()).length;
    const completeness = Math.round((filled / CLIENT_MAIN.length) * 100);
    return { completeness, cadastroCompleto: completeness === 100 };
  }

  function normalizeClient(item) {
    const name = String(item.name || item.nome || "").trim();
    const phone = item.phone || item.telefone || "";
    const birth = birthIso(item.birth || item.dataNascimento, item.id);
    const notes = item.notes || item.observacoes || "";
    const documento = item.documento || item.document || item.cpf || "";
    const email = item.email || "";
    const whatsapp = item.whatsapp || "";
    const mark = completenessOf({ name, documento, phone, email, birth });
    return {
      id: String(item.id || ("cliente-" + Date.now())),
      name,
      nome: name,
      initials: item.initials || initialsFrom(name),
      documento,
      telefone: phone,
      phone,
      whatsapp,
      email,
      dataNascimento: birth,
      birth,
      observacoes: notes,
      notes,
      cadastroCompleto: mark.cadastroCompleto,
      completeness: mark.completeness,
      since: item.since || `Cliente desde ${longDate(todayIso())}`,
      allergies: item.allergies || "",
      endereco: item.endereco || "",
      rg: item.rg || "",
      cpf: item.cpf || documento,
      profissao: item.profissao || "",
      comoConheceu: item.comoConheceu || item.comoNosConheceu || "",
      comoNosConheceu: item.comoConheceu || item.comoNosConheceu || "",
      comoConheceuOutro: item.comoConheceuOutro || ""
    };
  }

  function loadClients() {
    const seed = (window.StudioData.clients || []).map(normalizeClient);
    const stored = readJson(CLIENT_KEY, null);
    if (!Array.isArray(stored) || !stored.length) {
      localStorage.setItem(CLIENT_KEY, JSON.stringify(seed));
      return seed;
    }
    const live = stored.map(normalizeClient);
    const have = new Set(live.map((item) => String(item.id)));
    let added = false;
    seed.forEach((item) => {
      if (have.has(String(item.id))) return;
      live.push(item);
      have.add(String(item.id));
      added = true;
    });
    if (added) localStorage.setItem(CLIENT_KEY, JSON.stringify(live));
    return live;
  }

  let clients = loadClients();
  (function persistMigratedClients() {
    const stored = readJson(CLIENT_KEY, []);
    if (!Array.isArray(stored) || !stored.length) return;
    const dirty = stored.some((raw, index) => {
      const live = clients[index];
      if (!live) return Boolean(raw && raw.demo);
      return (
        String(raw.birth || "") !== String(live.birth || "") ||
        raw.demo === true ||
        String(raw.dataNascimento || "") !== String(live.birth || "")
      );
    });
    if (dirty) persistClients();
  })();

  function persistClients() {
    const payload = clients.map((item) => {
      const copy = { ...item };
      delete copy.idade;
      return copy;
    });
    localStorage.setItem(CLIENT_KEY, JSON.stringify(payload));
    document.dispatchEvent(new CustomEvent("clients:changed"));
  }

  const storedClients = readJson(CLIENT_KEY, []);
  if (Array.isArray(storedClients) && storedClients.some((item) => item && Object.prototype.hasOwnProperty.call(item, "idade"))) {
    persistClients();
  }

  function clientById(id) {
    return clients.find((item) => String(item.id) === String(id)) || null;
  }

  function clientIdFromName(name, fallback) {
    const found = clients.find((item) => item.name === name);
    return found ? found.id : fallback || "";
  }

  function catalogOf(ref) {
    const data = window.StudioData;
    if (!data || !ref) return null;
    return data.serviceById(ref) || data.serviceByName(ref) || null;
  }

  const LOOSE_MAINT = {
    "manutencao-tip": "alongamento-gel-na-tip",
    "manutencao-soft": "soft-gel",
    "manutencao-molde-f1": "molde-f1"
  };

  function originalServiceId(ref) {
    const key = String(ref || "");
    return LOOSE_MAINT[key] || key;
  }

  function cloneServiceLine(line) {
    return {
      servicoId: line.servicoId,
      nome: line.nome,
      categoria: line.categoria,
      valorReferencia: line.valorReferencia,
      fromPrice: Boolean(line.fromPrice),
      unidadePreco: line.unidadePreco || "",
      modalidade: line.modalidade === "manutencao" ? "manutencao" : "normal",
      profissional: line.profissional || ""
    };
  }

  function normalizeServiceLine(line, fallbackPro, fallbackPrice) {
    const raw = line || {};
    const rawId = String(raw.servicoId || raw.id || "");
    const mappedId = originalServiceId(rawId);
    const catalog = catalogOf(mappedId || raw.nome || raw.name || raw.servico);
    const nome = raw.nome || raw.name || raw.servico || catalog?.nome || catalog?.name || "";
    const parsed =
      raw.valorReferencia != null && raw.valorReferencia !== ""
        ? typeof raw.valorReferencia === "number"
          ? raw.valorReferencia
          : parseMoedaBR(raw.valorReferencia)
        : NaN;
    const valor = Number.isFinite(parsed) ? parsed : parseMoney(fallbackPrice);
    const fromStored = Object.prototype.hasOwnProperty.call(raw, "fromPrice");
    const looseMaint = Boolean(LOOSE_MAINT[rawId]);
    const modalidade =
      raw.modalidade === "manutencao" || looseMaint ? "manutencao" : "normal";
    return {
      servicoId: mappedId || catalog?.id || String(nome || "servico").toLowerCase().replace(/\s+/g, "-"),
      nome: looseMaint && catalog ? catalog.nome : nome,
      categoria: raw.categoria || catalog?.categoria || "",
      valorReferencia: Number.isFinite(valor) ? valor : 0,
      fromPrice: fromStored
        ? Boolean(raw.fromPrice)
        : Boolean(catalog?.fromPrice || catalog?.tipoPreco === "a_partir_de"),
      unidadePreco: raw.unidadePreco || catalog?.unidadePreco || "",
      modalidade,
      profissional: raw.profissional || raw.professional || fallbackPro || ""
    };
  }

  function cloneAppointment(item) {
    return {
      ...item,
      servicos: (item.servicos || []).map(cloneServiceLine)
    };
  }

  function normalize(item) {
    const date = parseDate(item.date || item.data || item.dateLabel);
    const clientName = item.client || item.cliente || "";
    const clientId = item.clientId || item.clienteId || clientIdFromName(clientName, "");
    const live = clientById(clientId);
    const fallbackPro = item.professional || item.profissional || "";
    let servicos = Array.isArray(item.servicos)
      ? item.servicos.map((line) => normalizeServiceLine(line, fallbackPro, item.price || item.valor))
      : [];
    if (!servicos.length && (item.service || item.servico)) {
      servicos = [
        normalizeServiceLine(
          {
            nome: item.service || item.servico,
            profissional: fallbackPro
          },
          fallbackPro,
          item.price || item.valor
        )
      ];
    }
    const extraRaw = item.valorExtra != null ? item.valorExtra : 0;
    const extra =
      typeof extraRaw === "number" && Number.isFinite(extraRaw)
        ? Math.max(0, extraRaw)
        : Math.max(0, parseMoedaBR(extraRaw));
    const subtotal = servicos.reduce((sum, line) => sum + (line.valorReferencia || 0), 0);
    const total = subtotal + extra;
    const serviceLabel = servicos.map((line) => line.nome).filter(Boolean).join(" · ");
    const professionalLabel = [
      ...new Set(servicos.map((line) => line.profissional).filter(Boolean))
    ].join(" · ");
    return {
      id: String(item.id),
      clientId,
      clienteId: clientId,
      client: live ? live.name : clientName,
      servicos,
      service: serviceLabel || item.service || item.servico || "",
      professional: professionalLabel || fallbackPro,
      date,
      time: item.time || item.horario || "",
      subtotalServicos: subtotal,
      valorExtra: extra,
      motivoValorExtra: item.motivoValorExtra || "",
      valorTotal: total,
      price: formatMoney(total),
      valor: total,
      status: normalizeStatus(item.status),
      notes: item.notes || item.observacoes || "",
      observacoes: item.notes || item.observacoes || "",
      formaPagamento:
        item.formaPagamento === "dinheiro" || item.formaPagamento === "cartao"
          ? item.formaPagamento
          : "pix",
      manutencaoId: item.manutencaoId || "",
      dateLabel: item.dateLabel || labelDate(date),
      dateShort: item.dateShort || shortDate(date)
    };
  }

  function seedList() {
    const seed = (window.StudioData.appointments || []).map(normalize);
    const created = readJson("studio-elegancy-ui-created", []);
    const overlay = readJson("studio-elegancy-ui-status", {});
    const extra = Array.isArray(created) ? created.map(normalize) : [];
    const merged = [...seed];
    extra.forEach((item) => {
      if (!merged.some((appt) => appt.id === item.id)) merged.push(item);
    });
    return merged.map((item) => {
      const patch = overlay[item.id];
      return patch ? normalize({ ...item, ...patch }) : item;
    });
  }

  function load() {
    const seed = seedList();
    const stored = readJson(APPT_KEY, null);
    if (!Array.isArray(stored) || !stored.length) {
      localStorage.setItem(APPT_KEY, JSON.stringify(seed));
      return seed;
    }
    const live = stored.map(normalize);
    const have = new Set(live.map((item) => String(item.id)));
    let added = false;
    seed.forEach((item) => {
      if (have.has(String(item.id))) return;
      live.push(item);
      have.add(String(item.id));
      added = true;
    });
    if (added) localStorage.setItem(APPT_KEY, JSON.stringify(live));
    return live;
  }

  let items = load();

  function persist() {
    localStorage.setItem(APPT_KEY, JSON.stringify(items));
    notify();
  }

  function notify() {
    document.dispatchEvent(new CustomEvent("appointments:changed"));
  }

  function nextId() {
    return "ag-" + Date.now();
  }

  function nextClientId() {
    return "cliente-" + Date.now();
  }

  function cloneAnamnese(item) {
    return JSON.parse(JSON.stringify(item));
  }

  function isAnamneseCompleta(item) {
    if (!item) return false;
    const client = clientById(item.clienteId);
    const nome = String(client?.name || "").trim();
    const aceite = Boolean(item.termo?.aceite);
    const data = String(item.termo?.data || "").trim();
    return Boolean(nome && aceite && data);
  }

  function normalizeAnamnese(item) {
    const record = {
      id: String(item.id || ("ana-" + Date.now())),
      clienteId: String(item.clienteId || item.clientId || ""),
      saude: item.saude || {},
      habitos: item.habitos || {},
      unhas: item.unhas || {},
      cilios: item.cilios || {},
      servicosAnamnese: item.servicosAnamnese || { unhas: [], cilios: [], outro: "" },
      termo: item.termo || {},
      dataPreenchimento: item.dataPreenchimento || item.criadoEm || "",
      atualizadoEm: item.atualizadoEm || ""
    };
    record.completa = isAnamneseCompleta(record);
    return record;
  }

  function loadAnamneses() {
    const stored = readJson(ANAMNESE_KEY, null);
    if (Array.isArray(stored)) return stored.map(normalizeAnamnese);
    localStorage.setItem(ANAMNESE_KEY, "[]");
    return [];
  }

  let anamneses = loadAnamneses();

  function migratePersonalFromAnamnese() {
    const stored = readJson(ANAMNESE_KEY, []);
    if (!Array.isArray(stored) || !stored.length) return;
    let clientsChanged = false;
    let anaChanged = false;
    stored.forEach((raw) => {
      const dp = raw.dadosPessoais;
      if (!dp || typeof dp !== "object") return;
      const index = clients.findIndex((item) => String(item.id) === String(raw.clienteId || raw.clientId));
      if (index < 0) return;
      anaChanged = true;
      const current = clients[index];
      const patch = {};
      const pairs = [
        ["name", dp.nome],
        ["birth", dp.nascimento],
        ["phone", dp.telefone],
        ["email", dp.email],
        ["endereco", dp.endereco],
        ["rg", dp.rg],
        ["cpf", dp.cpf],
        ["profissao", dp.profissao],
        ["comoConheceu", dp.comoConheceu],
        ["comoConheceuOutro", dp.comoConheceuOutro]
      ];
      pairs.forEach(([key, value]) => {
        if (!String(current[key] || "").trim() && String(value || "").trim()) patch[key] = value;
      });
      if (patch.cpf && !String(current.documento || "").trim()) patch.documento = patch.cpf;
      if (Object.keys(patch).length) {
        clients[index] = normalizeClient({ ...current, ...patch, id: current.id });
        clientsChanged = true;
      }
    });
    anamneses = stored.map((item) => {
      const copy = { ...item };
      delete copy.dadosPessoais;
      return normalizeAnamnese(copy);
    });
    if (clientsChanged) persistClients();
    if (anaChanged) persistAnamneses();
  }

  migratePersonalFromAnamnese();

  function persistAnamneses() {
    const payload = anamneses.map((item) => {
      const copy = { ...item };
      delete copy.dadosPessoais;
      return copy;
    });
    localStorage.setItem(ANAMNESE_KEY, JSON.stringify(payload));
    document.dispatchEvent(new CustomEvent("anamnese:changed"));
  }

  function anamneseByClient(clientId) {
    return anamneses.find((item) => String(item.clienteId) === String(clientId)) || null;
  }

  function withStats(client) {
    const rows = items.filter((item) => item.clientId === client.id);
    const active = rows.filter((item) => item.status !== "cancelado");
    const done = rows.filter((item) => item.status === "concluido");
    const sorted = [...rows].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    const lastActive = sorted.find((item) => item.status !== "cancelado") || sorted[0];
    const next = [...active]
      .filter(
        (item) =>
          item.date >= todayIso() && (item.status === "agendado" || item.status === "confirmado")
      )
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    const total = done.reduce((sum, item) => sum + (item.valor || 0), 0);
    const ana = anamneseByClient(client.id);
    return {
      ...client,
      visits: String(active.length),
      visitCount: active.length,
      historyTotal: formatMoney(total),
      historyTotalValue: total,
      last: lastActive
        ? `${lastActive.dateLabel || lastActive.dateShort} · ${(lastActive.servicos || []).map((line) => line.nome).join(" · ") || lastActive.service}`
        : "—",
      lastAppt: lastActive ? cloneAppointment(lastActive) : null,
      nextAppt: next ? cloneAppointment(next) : null,
      anamnese: ana ? cloneAnamnese(ana) : null,
      anamneseCompleta: isAnamneseCompleta(ana),
      anamneseData: ana ? ana.atualizadoEm || ana.dataPreenchimento : ""
    };
  }

  window.StudioState = {
    get today() {
      return todayIso();
    },
    list() {
      return items.map(cloneAppointment);
    },
    appointment(id) {
      const item = items.find((appt) => String(appt.id) === String(id));
      return item ? cloneAppointment(item) : null;
    },
    byClient(clientId) {
      const client = clientById(clientId);
      const name = client ? client.name : "";
      return items
        .filter((item) => item.clientId === clientId || (name && item.client === name))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .map(cloneAppointment);
    },
    upcoming() {
      return items
        .filter(
          (item) =>
            item.date >= todayIso() &&
            (item.status === "agendado" || item.status === "confirmado")
        )
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .map(cloneAppointment);
    },
    lastScheduleError: null,
    addAppointment(fields, options) {
      return this.upsertAppointment({ ...fields, id: fields.id || nextId() }, options);
    },
    saveAppointment(id, fields, options) {
      const index = items.findIndex((item) => String(item.id) === String(id));
      if (index < 0) return null;
      const current = items[index];
      const client = fields.client || current.client;
      return this.upsertAppointment(
        {
          ...current,
          ...fields,
          id: current.id,
          client,
          clientId: fields.clientId || fields.clienteId || clientIdFromName(client, current.clientId),
          date: fields.date || fields.dateLabel || current.date,
          notes: fields.notes != null ? fields.notes : current.notes
        },
        options
      );
    },
    upsertAppointment(fields, options) {
      const appt = normalize({ ...fields, id: fields.id || nextId() });
      const skip = options && options.skipConflict;
      if (!skip && window.StudioAvailability && typeof window.StudioAvailability.hasAppointmentConflict === "function") {
        const hit = window.StudioAvailability.hasAppointmentConflict(appt, appt.id);
        if (hit) {
          this.lastScheduleError = hit;
          return null;
        }
      }
      this.lastScheduleError = null;
      const index = items.findIndex((item) => String(item.id) === String(appt.id));
      if (index >= 0) items[index] = appt;
      else items.push(appt);
      persist();
      return cloneAppointment(appt);
    },
    setStatus(id, status) {
      return this.saveAppointment(id, { status: normalizeStatus(status) });
    },
    listClients() {
      return clients.map((item) => withStats(item));
    },
    client(id) {
      const item = clientById(id);
      return item ? withStats(item) : null;
    },
    findClientByDocument(documento) {
      const key = digits(documento);
      if (!key) return null;
      const item = clients.find((client) => digits(client.documento) === key);
      return item ? withStats(item) : null;
    },
    incompleteClients() {
      return clients.filter((item) => !item.cadastroCompleto).map((item) => withStats(item));
    },
    incompleteClientsCount() {
      return clients.filter((item) => !item.cadastroCompleto).length;
    },
    addClient(fields) {
      const documentMatch = this.findClientByDocument(fields.documento || fields.document);
      if (documentMatch) return { client: documentMatch, reused: true };
      const client = normalizeClient({ ...fields, id: fields.id || nextClientId() });
      clients.push(client);
      persistClients();
      return { client: withStats(client), reused: false };
    },
    saveClient(id, fields) {
      const index = clients.findIndex((item) => String(item.id) === String(id));
      if (index < 0) return null;
      const current = clients[index];
      const documentMatch = this.findClientByDocument(fields.documento || current.documento);
      if (documentMatch && documentMatch.id !== current.id) {
        return { client: documentMatch, reused: true };
      }
      clients[index] = normalizeClient({
        ...current,
        ...fields,
        id: current.id,
        initials: initialsFrom(fields.name || fields.nome || current.name)
      });
      delete clients[index].idade;
      const updated = clients[index];
      items.forEach((appt, apptIndex) => {
        if (appt.clientId === updated.id) {
          items[apptIndex] = { ...appt, client: updated.name };
        }
      });
      localStorage.setItem(APPT_KEY, JSON.stringify(items));
      persistClients();
      notify();
      return { client: withStats(updated), reused: false };
    },
    anamneseByClient(clientId) {
      const item = anamneseByClient(clientId);
      return item ? cloneAnamnese(item) : null;
    },
    saveAnamnese(fields) {
      const clienteId = String(fields.clienteId || fields.clientId || "");
      if (!clienteId) return null;
      const current = anamneseByClient(clienteId);
      const incoming = { ...fields };
      delete incoming.dadosPessoais;
      const record = normalizeAnamnese({
        ...current,
        ...incoming,
        id: current ? current.id : fields.id || "ana-" + Date.now(),
        clienteId,
        dataPreenchimento: current ? current.dataPreenchimento || todayIso() : todayIso(),
        atualizadoEm: todayIso()
      });
      if (current) {
        const index = anamneses.findIndex((item) => item.id === current.id);
        anamneses[index] = record;
      } else {
        anamneses.push(record);
      }
      persistAnamneses();
      return cloneAnamnese(record);
    }
  };

  window.badgeClass = function (status) {
    return `badge badge--${normalizeStatus(status)}`;
  };

  window.statusLabel = function (status) {
    return window.STATUS_LABEL[normalizeStatus(status)] || status;
  };

  window.formatLongDate = longDate;
  window.labelDate = labelDate;
  window.parseDate = parseDate;

  function isoFromDateText(value) {
    const text = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return "";
    const iso = `${match[3]}-${match[2]}-${match[1]}`;
    const [year, month, day] = iso.split("-").map(Number);
    const dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return "";
    return iso;
  }

  window.enhanceDateField = function (input) {
    if (!input) return null;
    const wrapExisting = input.closest(".date-field");
    let native = wrapExisting ? wrapExisting.querySelector(".date-field-native") : null;
    let cal = wrapExisting ? wrapExisting.querySelector(".date-field-cal") : null;

    function syncNative() {
      if (!native) return;
      native.value = isoFromDateText(input.value);
    }

    function showBr() {
      const iso = isoFromDateText(input.value);
      if (iso) input.value = labelDate(iso);
    }

    function setLocked() {
      const locked = Boolean(input.readOnly || input.disabled);
      if (cal) {
        cal.hidden = locked;
        cal.disabled = locked;
      }
      if (native) native.disabled = locked;
    }

    if (input.dataset.dateEnhanced === "1") {
      showBr();
      syncNative();
      setLocked();
      return input;
    }
    input.dataset.dateEnhanced = "1";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    if (!input.placeholder) input.placeholder = "dd/mm/aaaa";

    const wrap = document.createElement("div");
    wrap.className = "date-field";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    cal = document.createElement("button");
    cal.type = "button";
    cal.className = "date-field-cal";
    cal.setAttribute("aria-label", "Abrir calendário");
    cal.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 3v4M16 3v4M4 10h16" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';

    native = document.createElement("input");
    native.type = "date";
    native.className = "date-field-native";
    native.tabIndex = -1;
    native.setAttribute("aria-hidden", "true");
    cal.appendChild(native);
    wrap.appendChild(cal);

    showBr();
    syncNative();
    setLocked();

    input.addEventListener("input", syncNative);
    input.addEventListener("change", () => {
      showBr();
      syncNative();
    });
    input.addEventListener("blur", () => {
      showBr();
      syncNative();
    });

    native.addEventListener("change", () => {
      if (!native.value) return;
      input.value = labelDate(native.value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    cal.addEventListener("click", (event) => {
      if (input.readOnly || input.disabled) return;
      if (event.target === native) return;
      event.preventDefault();
      syncNative();
      if (typeof native.showPicker === "function") {
        try {
          native.showPicker();
          return;
        } catch (error) {
          /* fallback below */
        }
      }
      native.focus();
      native.click();
    });

    return input;
  };
  window.calcularIdade = calcularIdade;
  window.idadeLabel = idadeLabel;
  window.displayDate = function (value) {
    const text = String(value || "").trim();
    if (!text || text === "—") return "—";
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return labelDate(text);
    return text;
  };
  window.parseMoedaBR = parseMoedaBR;
  window.formatarMoedaBR = formatarMoedaBR;
  window.textoMoedaInput = textoMoedaInput;
  window.formatMoney = formatarMoedaBR;
  window.parseMoney = parseMoedaBR;
  window.formatCurrency = formatarMoedaBR;

  window.blankLabel = function (value) {
    const text = String(value || "").trim();
    return text && text !== "—" ? text : "Não informado";
  };

  window.clientListStatus = function (client) {
    if (!client) return { id: "incompleto", label: "Cadastro incompleto" };
    if (!client.cadastroCompleto) return { id: "incompleto", label: "Cadastro incompleto" };
    if (!client.anamneseCompleta) return { id: "anamnese", label: "Anamnese pendente" };
    return { id: "completo", label: "Completo" };
  };

  window.clientStatusMarkup = function (client) {
    if (!client || client.cadastroCompleto) return "";
    return `<span class="status-soft">Cadastro incompleto · ${client.completeness}%</span>`;
  };

  window.toast = function (message) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-open");
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => el.classList.remove("is-open"), 2400);
  };

  window.appointmentCard = function (appt, options = {}) {
    const item = window.StudioState.appointment(appt.id) || normalize(appt);
    const live = window.StudioState.client(item.clientId);
    const name = live ? live.name : item.client;
    const date = options.showDate
      ? `<span class="appt-date">${item.dateShort}</span>`
      : "";
    return `
      <article class="card appt-card" data-appt="${item.id}">
        <div>
          <div class="appt-time">${item.time}</div>
          ${date}
        </div>
        <div>
          <a class="appt-name" href="clientes.html?cliente=${item.clientId}">${name}</a>
          <div class="appt-meta">${item.service || "Serviços a definir"}  ·  ${item.professional || "Profissional a definir"}</div>
        </div>
        <div class="appt-price">${item.price}</div>
        <span class="${window.badgeClass(item.status)}">${window.statusLabel(item.status)}</span>
      </article>
    `;
  };
})();
