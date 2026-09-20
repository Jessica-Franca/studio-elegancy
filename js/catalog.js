(function () {
  const KEY = "studioElegancy_servicos";
  const TAXONOMY_KEY = "studioElegancy_catalogo";
  const SCHEMA_KEY = "studioElegancy_catalogo_schema";
  const SCHEMA = "svc2";
  const SEED_CATEGORIES = ["Unhas", "Cílios", "Sobrancelhas"];
  const PROFESSIONALS = ["Bruna", "Amanda"];
  const BRUNA = ["Bruna"];
  const AMANDA = ["Amanda"];
  const BOTH = ["Bruna", "Amanda"];
  const DEFAULT_SUBGROUPS = {
    Unhas: ["Mãos e pés", "Alongamentos", "Extras", "Spa dos pés"],
    Cílios: ["Alongamentos", "Outros"],
    Sobrancelhas: ["Design"]
  };
  const LOOSE_MAINT = {
    "manutencao-tip": "alongamento-gel-na-tip",
    "manutencao-soft": "soft-gel",
    "manutencao-molde-f1": "molde-f1"
  };
  const HIDE_IDS = [
    "manutencao-tip",
    "manutencao-soft",
    "manutencao-molde-f1",
    "blindagem",
    "esmaltacao-gel-mao",
    "esmaltacao-gel-pe",
    "esmaltacao-gel-mao-pe",
    "decoracao"
  ];

  function money(value) {
    if (typeof window.formatarMoedaBR === "function") return window.formatarMoedaBR(value);
    const numero = Number(value);
    if (!Number.isFinite(numero)) return "R$ 0,00";
    const [reais, centavos] = Math.abs(numero).toFixed(2).split(".");
    return (numero < 0 ? "-" : "") + "R$ " + reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + centavos;
  }

  function parseNum(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof window.parseMoedaBR === "function") {
      const parsed = window.parseMoedaBR(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function foldName(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function tidyName(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function official(id, nome, cat, sub, pix, cartao, dur, pros, extra) {
    extra = extra || {};
    const maint = extra.maint || null;
    return {
      id,
      nome,
      categoria: cat,
      subgrupo: sub,
      valorPix: pix,
      valorCartao: cartao,
      valorReferencia: pix,
      tipoPreco: extra.tipo || "fixo",
      unidadePreco: extra.unidade || "",
      duracaoMinutos: dur,
      profissionaisHabilitadas: pros.slice(),
      observacoes: extra.obs || "",
      exigeManutencao: Boolean(maint),
      prazoManutencao: maint ? maint.prazo : 0,
      prazoUnidade: maint ? maint.unidade || "dias" : "dias",
      manutencaoRegra: maint ? maint.regra || "" : "",
      manutencaoNome: maint ? maint.nome || "" : "",
      valorPixManutencao: maint ? maint.pix : 0,
      valorCartaoManutencao: maint ? maint.cartao : 0,
      servicoManutencaoId: maint ? id : "",
      ativo: true,
      legadoManutencaoSolta: false
    };
  }

  const CILIOS_MAINT = (pix, cartao, regra) => ({
    prazo: 15,
    unidade: "dias",
    regra: regra || "15 dias",
    nome: "",
    pix,
    cartao
  });

  const UNHAS_MAINT = (nome, pix, cartao) => ({
    prazo: 3,
    unidade: "meses",
    regra: nome,
    nome,
    pix,
    cartao
  });

  const OFFICIAL_SERVICES = [
    official("mao", "Mão", "Unhas", "Mãos e pés", 35, 37, 30, BRUNA),
    official("pe", "Pé", "Unhas", "Mãos e pés", 40, 42, 40, BRUNA),
    official("mao-e-pe", "Mão e Pé", "Unhas", "Mãos e pés", 70, 74, 70, BRUNA),
    official("spa-dos-pes", "Spa dos Pés + Esmaltação Tradicional", "Unhas", "Spa dos pés", 60, 62, 45, BRUNA),
    official("spa-esmaltacao-gel", "Spa dos Pés + Esmaltação em Gel", "Unhas", "Spa dos pés", 80, 83, 70, BRUNA),
    official(
      "alongamento-gel-na-tip",
      "Alongamento Gel na Tip",
      "Unhas",
      "Alongamentos",
      160,
      165,
      90,
      BRUNA,
      { maint: UNHAS_MAINT("Manutenção Tip", 65, 68) }
    ),
    official("soft-gel", "Soft Gel", "Unhas", "Alongamentos", 120, 124, 75, BRUNA, {
      maint: UNHAS_MAINT("Manutenção Soft Gel", 70, 73)
    }),
    official("molde-f1", "Molde F1", "Unhas", "Alongamentos", 150, 155, 90, BRUNA, {
      maint: UNHAS_MAINT("Manutenção Molde F1", 120, 124)
    }),
    official("banho-de-gel", "Banho de Gel", "Unhas", "Alongamentos", 80, 83, 50, BRUNA),
    official("postica-realista", "Postiças Express", "Unhas", "Extras", 130, 134, 60, BRUNA),
    official("nail-art", "Nail Art Simples", "Unhas", "Extras", 90, 93, 30, BRUNA),
    official("nail-art-elaborada", "Nail Art Elaborada", "Unhas", "Extras", 120, 124, 45, BRUNA),
    official("francesinha", "Francesinha", "Unhas", "Extras", 49.9, 52, 15, BRUNA),
    official("pedrarias", "Pedrarias, Charms e Pingentes", "Unhas", "Extras", 30, 31, 20, BRUNA),
    official("nail-3d", "3D", "Unhas", "Extras", 50, 52, 30, BRUNA, { tipo: "a_partir_de" }),
    official("esmalte-magnetico", "Esmalte Magnético", "Unhas", "Extras", 10, 11, 15, BRUNA),
    official("po-cromado", "Pó Cromado", "Unhas", "Extras", 5, 6, 10, BRUNA, { unidade: "por unha" }),
    official("remocao-alongamentos", "Remoção de Alongamento", "Unhas", "Extras", 20, 21, 40, BRUNA),
    official("fio-a-fio", "Fio a Fio", "Cílios", "Alongamentos", 120, 124, 90, AMANDA, {
      maint: CILIOS_MAINT(60, 62, "15 dias"),
      obs: "Manutenção de cílios até 15 dias garante o resultado."
    }),
    official("volume-brasileiro", "Brasileiro", "Cílios", "Alongamentos", 150, 155, 90, AMANDA, {
      maint: CILIOS_MAINT(80, 83, "até 15 dias"),
      obs: "Manutenção de cílios até 15 dias garante o resultado."
    }),
    official("alongamento-light", "Light", "Cílios", "Alongamentos", 100, 103, 75, AMANDA, {
      maint: CILIOS_MAINT(50, 52, "15 dias"),
      obs: "Manutenção de cílios até 15 dias garante o resultado."
    }),
    official("volume-hibrido", "Híbrido", "Cílios", "Alongamentos", 150, 155, 90, AMANDA, {
      maint: CILIOS_MAINT(80, 83, "até 15 dias"),
      obs: "Manutenção de cílios até 15 dias garante o resultado."
    }),
    official("volume-russo", "Russo", "Cílios", "Alongamentos", 180, 186, 120, AMANDA, {
      maint: CILIOS_MAINT(95, 98, "até 15 dias"),
      obs: "Manutenção de cílios até 15 dias garante o resultado."
    }),
    official("anime", "Anime", "Cílios", "Alongamentos", 170, 176, 100, AMANDA, {
      maint: CILIOS_MAINT(90, 93, "até 15 dias"),
      obs: "Manutenção de cílios até 15 dias garante o resultado."
    }),
    official("efeito-elegancy", "Efeito Elegancy", "Cílios", "Alongamentos", 190, 196, 110, AMANDA, {
      maint: CILIOS_MAINT(95, 98, "até 15 dias"),
      obs: "Manutenção de cílios até 15 dias garante o resultado."
    }),
    official("lash-lifting", "Lash Lifting", "Cílios", "Outros", 100, 103, 60, AMANDA),
    official("remocao-cilios", "Remoção de Cílios", "Cílios", "Outros", 50, 52, 40, AMANDA),
    official("design", "Design", "Sobrancelhas", "Design", 40, 40, 30, BOTH),
    official("henna", "Henna", "Sobrancelhas", "Design", 60, 60, 40, BOTH),
    official("brow-lamination", "Brow lamination", "Sobrancelhas", "Design", 120, 120, 60, BOTH)
  ];

  function defaultSubgrupo(item) {
    if (item.subgrupo) return item.subgrupo;
    const name = item.nome || item.name || "";
    const category = item.categoria || "";
    if (category === "Unhas") {
      if (["Mão", "Pé", "Mão e Pé", "Mão e pé"].includes(name)) return "Mãos e pés";
      if (/alongamento|soft gel|molde|banho/i.test(name)) return "Alongamentos";
      if (/spa/i.test(name)) return "Spa dos pés";
      return "Extras";
    }
    if (category === "Cílios") return /lifting|remo/i.test(name) ? "Outros" : "Alongamentos";
    if (category === "Sobrancelhas") return "Design";
    return item.group || "Outros";
  }

  function tipoOf(item) {
    if (item.tipoPreco === "a_partir_de" || item.tipoPreco === "fixo") return item.tipoPreco;
    return item.fromPrice ? "a_partir_de" : "fixo";
  }

  function unidadeOf(item) {
    const raw = String(item.unidadePreco || "").trim().toLowerCase();
    return raw === "por unha" ? "por unha" : "";
  }

  function formatAmount(svc, value) {
    const text = money(value);
    const prefix = svc.tipoPreco === "a_partir_de" ? "A partir de " : "";
    const suffix = svc.unidadePreco === "por unha" ? " por unha" : "";
    return prefix + text + suffix;
  }

  function durationOf(item) {
    const n = Math.round(Number(item && item.duracaoMinutos));
    if (Number.isFinite(n) && n > 0) return n;
    const data = window.StudioData;
    if (data && typeof data.demoDuration === "function") {
      return data.demoDuration((item && item.id) || "");
    }
    return 60;
  }

  function priceFor(svc, modalidade, pagamento) {
    const pay = pagamento === "cartao" ? "cartao" : "pix";
    const maint = modalidade === "manutencao" && svc && svc.exigeManutencao;
    if (maint) {
      return pay === "cartao" ? Number(svc.valorCartaoManutencao) || 0 : Number(svc.valorPixManutencao) || 0;
    }
    if (!svc) return 0;
    return pay === "cartao" ? Number(svc.valorCartao) || 0 : Number(svc.valorPix) || Number(svc.valorReferencia) || 0;
  }

  function originalIdOf(ref) {
    const key = String(ref || "");
    return LOOSE_MAINT[key] || key;
  }

  function viewOf(svc) {
    const profissionais = Array.isArray(svc.profissionaisHabilitadas)
      ? svc.profissionaisHabilitadas.slice()
      : [];
    return {
      id: svc.id,
      nome: svc.nome,
      name: svc.nome,
      categoria: svc.categoria,
      subgrupo: svc.subgrupo,
      group: svc.subgrupo,
      valorPix: svc.valorPix,
      valorCartao: svc.valorCartao,
      valorReferencia: svc.valorPix,
      tipoPreco: svc.tipoPreco,
      unidadePreco: svc.unidadePreco || "",
      fromPrice: svc.tipoPreco === "a_partir_de",
      price: formatAmount(svc, svc.valorPix),
      priceCartao: formatAmount(svc, svc.valorCartao),
      duracaoMinutos: durationOf(svc),
      profissionaisHabilitadas: profissionais,
      observacoes: svc.observacoes || "",
      exigeManutencao: svc.exigeManutencao === true,
      prazoManutencao: Number(svc.prazoManutencao) || 0,
      prazoUnidade: svc.prazoUnidade === "semanas" || svc.prazoUnidade === "meses" ? svc.prazoUnidade : "dias",
      manutencaoRegra: svc.manutencaoRegra || "",
      manutencaoNome: svc.manutencaoNome || "",
      valorPixManutencao: Number(svc.valorPixManutencao) || 0,
      valorCartaoManutencao: Number(svc.valorCartaoManutencao) || 0,
      servicoManutencaoId: svc.exigeManutencao ? svc.id : "",
      ativo: svc.ativo !== false,
      legadoManutencaoSolta: svc.legadoManutencaoSolta === true,
      criadoEm: svc.criadoEm || "",
      atualizadoEm: svc.atualizadoEm || ""
    };
  }

  function normalizeRecord(raw, fallbackTime) {
    const item = raw || {};
    const nome = String(item.nome || item.name || "").trim();
    const pix = parseNum(item.valorPix != null ? item.valorPix : item.valorReferencia);
    const cartao = parseNum(item.valorCartao != null ? item.valorCartao : pix);
    const pixMaint = parseNum(item.valorPixManutencao);
    const cartaoMaint = parseNum(item.valorCartaoManutencao);
    const tipo = tipoOf(item);
    const stamp = fallbackTime || nowIso();
    const exige = item.exigeManutencao === true;
    const prazo = Number(item.prazoManutencao);
    const unidade = item.prazoUnidade === "semanas" || item.prazoUnidade === "meses" ? item.prazoUnidade : "dias";
    const id = String(item.id || "");
    return {
      id,
      nome,
      categoria: item.categoria || "Unhas",
      subgrupo: defaultSubgrupo(item),
      valorPix: Number.isFinite(pix) ? pix : 0,
      valorCartao: Number.isFinite(cartao) ? cartao : Number.isFinite(pix) ? pix : 0,
      valorReferencia: Number.isFinite(pix) ? pix : 0,
      tipoPreco: tipo,
      unidadePreco: unidadeOf(item),
      duracaoMinutos: durationOf(item),
      profissionaisHabilitadas: Array.isArray(item.profissionaisHabilitadas)
        ? item.profissionaisHabilitadas.filter(Boolean)
        : [],
      observacoes: String(item.observacoes || "").trim(),
      exigeManutencao: exige,
      prazoManutencao: exige && Number.isFinite(prazo) ? prazo : 0,
      prazoUnidade: unidade,
      manutencaoRegra: String(item.manutencaoRegra || "").trim(),
      manutencaoNome: String(item.manutencaoNome || "").trim(),
      valorPixManutencao: exige && Number.isFinite(pixMaint) ? pixMaint : 0,
      valorCartaoManutencao: exige && Number.isFinite(cartaoMaint) ? cartaoMaint : exige && Number.isFinite(pixMaint) ? pixMaint : 0,
      servicoManutencaoId: exige ? id : "",
      ativo: item.ativo !== false,
      legadoManutencaoSolta: item.legadoManutencaoSolta === true || Boolean(LOOSE_MAINT[id]),
      criadoEm: item.criadoEm || stamp,
      atualizadoEm: item.atualizadoEm || stamp
    };
  }

  function applyOfficialOverlay(list) {
    const stamp = nowIso();
    const byId = {};
    list.forEach((item) => {
      byId[item.id] = item;
    });
    OFFICIAL_SERVICES.forEach((src) => {
      const current = byId[src.id];
      const merged = normalizeRecord(
        {
          ...(current || {}),
          ...src,
          duracaoMinutos: (current && current.duracaoMinutos) || src.duracaoMinutos,
          criadoEm: current ? current.criadoEm : stamp,
          atualizadoEm: stamp,
          ativo: true,
          legadoManutencaoSolta: false
        },
        stamp
      );
      byId[src.id] = merged;
    });
    HIDE_IDS.forEach((id) => {
      if (!byId[id]) return;
      byId[id] = {
        ...byId[id],
        ativo: false,
        legadoManutencaoSolta: Boolean(LOOSE_MAINT[id]),
        exigeManutencao: false,
        servicoManutencaoId: "",
        atualizadoEm: stamp
      };
    });
    return Object.keys(byId).map((id) => byId[id]);
  }

  function seedOfficial() {
    const stamp = nowIso();
    return OFFICIAL_SERVICES.map((item) => normalizeRecord(item, stamp));
  }

  function readStored() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function load() {
    const stored = readStored();
    const schema = localStorage.getItem(SCHEMA_KEY);
    if (Array.isArray(stored) && stored.length) {
      let mapped = stored.map((item) => normalizeRecord(item)).filter((item) => item.id && item.nome);
      if (schema !== SCHEMA) {
        mapped = applyOfficialOverlay(mapped);
        localStorage.setItem(SCHEMA_KEY, SCHEMA);
      }
      localStorage.setItem(KEY, JSON.stringify(mapped));
      return mapped;
    }
    const seeded = seedOfficial();
    localStorage.setItem(KEY, JSON.stringify(seeded));
    localStorage.setItem(SCHEMA_KEY, SCHEMA);
    return seeded;
  }

  let services = load();
  let taxonomy = [];

  function readTaxonomy() {
    try {
      const raw = localStorage.getItem(TAXONOMY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed && Array.isArray(parsed.categorias) ? parsed.categorias : [];
    } catch (error) {
      return [];
    }
  }

  function persistTaxonomy() {
    localStorage.setItem(TAXONOMY_KEY, JSON.stringify({ categorias: taxonomy }));
    if (window.StudioState) window.StudioState.CATEGORIES = listCategories();
    document.dispatchEvent(new CustomEvent("catalog:changed"));
  }

  function upsertCategory(nome, subgrupos) {
    const tidy = tidyName(nome);
    if (!tidy) return null;
    const key = foldName(tidy);
    let rec = taxonomy.find((item) => foldName(item.nome) === key);
    if (!rec) {
      rec = { nome: tidy, subgrupos: [] };
      taxonomy.push(rec);
    }
    (subgrupos || []).forEach((sub) => {
      const label = tidyName(sub);
      if (!label) return;
      if (!rec.subgrupos.some((item) => foldName(item) === foldName(label))) {
        rec.subgrupos.push(label);
      }
    });
    return rec;
  }

  function bootstrapTaxonomy() {
    taxonomy = [];
    SEED_CATEGORIES.forEach((cat) => upsertCategory(cat, DEFAULT_SUBGROUPS[cat] || []));
    readTaxonomy().forEach((item) => {
      if (item && item.nome) upsertCategory(item.nome, item.subgrupos || []);
    });
    services.forEach((item) => {
      if (item.categoria) upsertCategory(item.categoria, item.subgrupo ? [item.subgrupo] : []);
    });
    persistTaxonomy();
  }

  function listCategories() {
    return taxonomy.map((item) => item.nome);
  }

  function subgroupsFor(categoria) {
    const rec = taxonomy.find((item) => foldName(item.nome) === foldName(categoria));
    return rec ? rec.subgrupos.slice() : [];
  }

  function addCategory(nome) {
    const tidy = tidyName(nome);
    if (!tidy) return { ok: false, error: "Informe o nome da categoria." };
    if (taxonomy.some((item) => foldName(item.nome) === foldName(tidy))) {
      return { ok: false, error: "Essa categoria já existe." };
    }
    upsertCategory(tidy, []);
    persistTaxonomy();
    return { ok: true, nome: tidy };
  }

  function addSubgroup(categoria, nome) {
    const cat = tidyName(categoria);
    const tidy = tidyName(nome);
    if (!cat) return { ok: false, error: "Selecione a categoria." };
    if (!tidy) return { ok: false, error: "Informe o nome do subgrupo." };
    const rec = upsertCategory(cat, []) || taxonomy.find((item) => foldName(item.nome) === foldName(cat));
    if (!rec) return { ok: false, error: "Categoria não encontrada." };
    if (rec.subgrupos.some((item) => foldName(item) === foldName(tidy))) {
      return { ok: false, error: "Esse subgrupo já existe nesta categoria." };
    }
    rec.subgrupos.push(tidy);
    persistTaxonomy();
    return { ok: true, nome: tidy, categoria: rec.nome };
  }

  bootstrapTaxonomy();

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(services));
    syncStudioData();
    document.dispatchEvent(new CustomEvent("services:changed"));
  }

  function syncStudioData() {
    if (!window.StudioData) return;
    window.StudioData.services = services.map(viewOf);
  }

  function nextId() {
    let max = 0;
    services.forEach((item) => {
      const match = String(item.id).match(/^SERV(\d+)$/i);
      if (match) max = Math.max(max, Number(match[1]));
    });
    return "SERV" + String(max + 1).padStart(3, "0");
  }

  function findIndex(id) {
    return services.findIndex((item) => String(item.id) === String(id));
  }

  function findByRef(ref) {
    if (!ref) return null;
    const mapped = originalIdOf(ref);
    const key = String(mapped).trim().toLowerCase();
    return (
      services.find((item) => String(item.id) === String(mapped)) ||
      services.find((item) => String(item.nome).toLowerCase() === key) ||
      services.find((item) => foldName(item.nome) === foldName(ref)) ||
      null
    );
  }

  function clone(item) {
    return item ? viewOf(item) : null;
  }

  function list() {
    return services.map(viewOf);
  }

  function serviceUsed(id) {
    const item = findByRef(id);
    if (!item || !window.StudioState || typeof window.StudioState.list !== "function") return false;
    const nome = item.nome;
    return window.StudioState.list().some((appt) =>
      (appt.servicos || []).some(
        (line) =>
          String(line.servicoId) === String(item.id) ||
          String(originalIdOf(line.servicoId)) === String(item.id) ||
          String(line.nome || "").toLowerCase() === String(nome).toLowerCase()
      )
    );
  }

  function saveService(fields) {
    const existing = fields.id ? findByRef(fields.id) : null;
    const stamp = nowIso();
    const record = normalizeRecord(
      {
        ...existing,
        ...fields,
        id: existing ? existing.id : fields.id || nextId(),
        criadoEm: existing ? existing.criadoEm : stamp,
        atualizadoEm: stamp
      },
      stamp
    );
    if (!record.nome) return null;
    if (record.exigeManutencao) record.servicoManutencaoId = record.id;
    if (record.categoria) upsertCategory(record.categoria, record.subgrupo ? [record.subgrupo] : []);
    persistTaxonomy();
    const index = findIndex(record.id);
    if (index >= 0) services[index] = record;
    else services.push(record);
    persist();
    return clone(record);
  }

  function setServiceActive(id, ativo) {
    const index = findIndex(id);
    if (index < 0) return null;
    services[index] = {
      ...services[index],
      ativo: Boolean(ativo),
      atualizadoEm: nowIso()
    };
    persist();
    return clone(services[index]);
  }

  function deleteService(id) {
    if (serviceUsed(id)) return false;
    const index = findIndex(id);
    if (index < 0) return false;
    services.splice(index, 1);
    persist();
    return true;
  }

  syncStudioData();

  if (!window.StudioState) window.StudioState = {};
  window.StudioState.CATEGORIES = listCategories();
  window.StudioState.PROFESSIONALS = PROFESSIONALS;
  window.StudioState.listCategories = listCategories;
  window.StudioState.listServices = list;
  window.StudioState.service = function (ref) {
    return clone(findByRef(ref));
  };
  window.StudioState.subgroupsFor = subgroupsFor;
  window.StudioState.addCategory = addCategory;
  window.StudioState.addSubgroup = addSubgroup;
  window.StudioState.serviceUsed = serviceUsed;
  window.StudioState.saveService = saveService;
  window.StudioState.setServiceActive = setServiceActive;
  window.StudioState.deleteService = deleteService;
  window.StudioState.priceForService = function (ref, modalidade, pagamento) {
    const svc = findByRef(ref);
    return priceFor(svc ? viewOf(svc) : null, modalidade, pagamento);
  };
  window.StudioState.formatServicePrice = formatAmount;
  window.StudioState.originalServiceId = originalIdOf;
  window.StudioState.LOOSE_MAINT = LOOSE_MAINT;
  if (typeof window.formatCurrency !== "function") window.formatCurrency = money;
})();
