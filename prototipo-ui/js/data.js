const STUDIO_DEMO_DURATIONS = {
  mao: 30,
  pe: 40,
  "mao-e-pe": 70,
  "alongamento-gel-na-tip": 90,
  "soft-gel": 75,
  "molde-f1": 90,
  blindagem: 45,
  "banho-de-gel": 50,
  "manutencao-tip": 60,
  "manutencao-soft": 50,
  "manutencao-molde-f1": 60,
  "esmaltacao-gel-mao": 40,
  "esmaltacao-gel-pe": 40,
  "esmaltacao-gel-mao-pe": 70,
  "nail-art": 30,
  francesinha: 15,
  "remocao-alongamentos": 40,
  decoracao: 20,
  "postica-realista": 60,
  "spa-dos-pes": 45,
  "spa-esmaltacao-gel": 70,
  "alongamento-light": 75,
  "fio-a-fio": 90,
  "volume-brasileiro": 90,
  "volume-hibrido": 90,
  anime: 100,
  "volume-russo": 120,
  "lash-lifting": 60,
  design: 30,
  henna: 40,
  "brow-lamination": 60
};

window.StudioData = {
  todayLabel: "14 de setembro",
  demoDurations: STUDIO_DEMO_DURATIONS,
  clients: [
    {
      id: "maria",
      name: "Maria Silva",
      initials: "MS",
      phone: "(11) 99999-9999",
      whatsapp: "(11) 99999-9999",
      email: "maria.silva.demo@email.com",
      birth: "1992-03-15",
      since: "Cliente desde 12 de setembro",
      allergies: "Sem alergias conhecidas",
      notes: "Prefere horários à tarde. Gosta de volume brasileiro.",
      profissao: "Administradora"
    },
    {
      id: "ana",
      name: "Ana Souza",
      initials: "AS",
      phone: "(11) 98888-8888",
      whatsapp: "(11) 98888-8888",
      birth: "1994-07-22",
      since: "Cliente desde 12 de setembro",
      allergies: "",
      notes: "Prefere atendimento pela manhã."
    },
    {
      id: "carla",
      name: "Carla Santos",
      initials: "CS",
      phone: "(11) 97777-7777",
      whatsapp: "(11) 97777-7777",
      birth: "1988-11-10",
      since: "Cliente desde 12 de setembro",
      allergies: "",
      notes: ""
    },
    {
      id: "juliana",
      name: "Juliana Oliveira",
      initials: "JO",
      phone: "(11) 96666-6666",
      whatsapp: "(11) 96666-6666",
      email: "juliana.oliveira.demo@email.com",
      birth: "1996-01-05",
      since: "Cliente desde 12 de setembro",
      allergies: "",
      notes: ""
    }
  ],
  appointments: [
    {
      id: "a7",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-14",
      time: "09:00",
      status: "agendado",
      servicos: [
        { servicoId: "mao", nome: "Mão", categoria: "Unhas", valorReferencia: 35, profissional: "Bruna" }
      ]
    },
    {
      id: "a11",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-14",
      time: "09:00",
      status: "agendado",
      servicos: [
        { servicoId: "volume-brasileiro", nome: "Volume brasileiro", categoria: "Cílios", valorReferencia: 150, profissional: "Amanda" }
      ]
    },
    {
      id: "a8",
      clientId: "carla",
      client: "Carla Santos",
      date: "2026-09-14",
      time: "09:30",
      status: "confirmado",
      servicos: [
        { servicoId: "pe", nome: "Pé", categoria: "Unhas", valorReferencia: 40, profissional: "Bruna" }
      ]
    },
    {
      id: "a9",
      clientId: "ana",
      client: "Ana Souza",
      date: "2026-09-14",
      time: "10:15",
      status: "agendado",
      servicos: [
        { servicoId: "design", nome: "Design", categoria: "Sobrancelhas", valorReferencia: 40, profissional: "Bruna" }
      ]
    },
    {
      id: "a12",
      clientId: "carla",
      client: "Carla Santos",
      date: "2026-09-14",
      time: "10:30",
      status: "agendado",
      servicos: [
        { servicoId: "lash-lifting", nome: "Lash lifting", categoria: "Cílios", valorReferencia: 100, profissional: "Amanda" }
      ]
    },
    {
      id: "a10",
      clientId: "maria",
      client: "Maria Silva",
      date: "2026-09-14",
      time: "11:00",
      status: "agendado",
      servicos: [
        { servicoId: "esmaltacao-gel-mao", nome: "Esmaltação em gel — mão", categoria: "Unhas", valorReferencia: 65, profissional: "Bruna" }
      ]
    },
    {
      id: "a13",
      clientId: "ana",
      client: "Ana Souza",
      date: "2026-09-14",
      time: "13:00",
      status: "confirmado",
      servicos: [
        { servicoId: "fio-a-fio", nome: "Fio a fio", categoria: "Cílios", valorReferencia: 120, profissional: "Amanda" }
      ]
    },
    {
      id: "a14",
      clientId: "carla",
      client: "Carla Santos",
      date: "2026-09-14",
      time: "14:00",
      status: "agendado",
      servicos: [
        { servicoId: "mao", nome: "Mão", categoria: "Unhas", valorReferencia: 35, profissional: "Bruna" },
        { servicoId: "pe", nome: "Pé", categoria: "Unhas", valorReferencia: 40, profissional: "Bruna" }
      ]
    },
    {
      id: "a1",
      clientId: "maria",
      client: "Maria Silva",
      date: "2026-09-14",
      time: "14:30",
      status: "agendado",
      servicos: [
        { servicoId: "lash-lifting", nome: "Lash lifting", categoria: "Cílios", valorReferencia: 100, profissional: "Amanda" }
      ]
    },
    {
      id: "a15",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-14",
      time: "15:15",
      status: "agendado",
      servicos: [
        { servicoId: "blindagem", nome: "Blindagem", categoria: "Unhas", valorReferencia: 70, profissional: "Bruna" }
      ]
    },
    {
      id: "a17",
      clientId: "carla",
      client: "Carla Santos",
      date: "2026-09-15",
      time: "09:00",
      status: "agendado",
      servicos: [
        { servicoId: "soft-gel", nome: "Soft gel", categoria: "Unhas", valorReferencia: 120, profissional: "Bruna" }
      ]
    },
    {
      id: "a2",
      clientId: "ana",
      client: "Ana Souza",
      date: "2026-09-15",
      time: "09:00",
      status: "confirmado",
      servicos: [
        { servicoId: "lash-lifting", nome: "Lash lifting", categoria: "Cílios", valorReferencia: 100, profissional: "Amanda" }
      ]
    },
    {
      id: "a19",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-15",
      time: "10:00",
      status: "agendado",
      servicos: [
        { servicoId: "volume-hibrido", nome: "Volume híbrido", categoria: "Cílios", valorReferencia: 150, profissional: "Amanda" }
      ]
    },
    {
      id: "a18",
      clientId: "maria",
      client: "Maria Silva",
      date: "2026-09-15",
      time: "10:15",
      status: "agendado",
      servicos: [
        { servicoId: "henna", nome: "Henna", categoria: "Sobrancelhas", valorReferencia: 60, profissional: "Bruna" }
      ]
    },
    {
      id: "a20",
      clientId: "maria",
      client: "Maria Silva",
      date: "2026-09-16",
      time: "09:00",
      status: "agendado",
      servicos: [
        { servicoId: "molde-f1", nome: "Molde F1", categoria: "Unhas", valorReferencia: 150, profissional: "Bruna" }
      ]
    },
    {
      id: "a21",
      clientId: "ana",
      client: "Ana Souza",
      date: "2026-09-16",
      time: "09:00",
      status: "confirmado",
      servicos: [
        { servicoId: "anime", nome: "Anime", categoria: "Cílios", valorReferencia: 170, profissional: "Amanda" }
      ]
    },
    {
      id: "a22",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-16",
      time: "10:45",
      status: "agendado",
      servicos: [
        { servicoId: "spa-dos-pes", nome: "Spa dos pés", categoria: "Unhas", valorReferencia: 80, profissional: "Bruna" }
      ]
    },
    {
      id: "a27",
      clientId: "maria",
      client: "Maria Silva",
      date: "2026-09-16",
      time: "11:30",
      status: "agendado",
      servicos: [
        { servicoId: "mao", nome: "Mão", categoria: "Unhas", valorReferencia: 35, profissional: "Bruna" },
        { servicoId: "alongamento-light", nome: "Alongamento light", categoria: "Cílios", valorReferencia: 100, profissional: "Amanda" }
      ]
    },
    {
      id: "a3",
      clientId: "carla",
      client: "Carla Santos",
      date: "2026-09-16",
      time: "14:00",
      status: "agendado",
      servicos: [
        { servicoId: "volume-brasileiro", nome: "Volume brasileiro", categoria: "Cílios", valorReferencia: 150, profissional: "Amanda" }
      ]
    },
    {
      id: "a23",
      clientId: "ana",
      client: "Ana Souza",
      date: "2026-09-17",
      time: "09:00",
      status: "agendado",
      servicos: [
        { servicoId: "mao-e-pe", nome: "Mão e pé", categoria: "Unhas", valorReferencia: 70, profissional: "Bruna" }
      ]
    },
    {
      id: "a24",
      clientId: "carla",
      client: "Carla Santos",
      date: "2026-09-17",
      time: "09:00",
      status: "agendado",
      servicos: [
        { servicoId: "alongamento-light", nome: "Alongamento light", categoria: "Cílios", valorReferencia: 100, profissional: "Amanda" }
      ]
    },
    {
      id: "a4",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-17",
      time: "10:30",
      status: "agendado",
      servicos: [
        { servicoId: "alongamento-gel-na-tip", nome: "Alongamento gel na tip", categoria: "Unhas", valorReferencia: 160, profissional: "Bruna" }
      ]
    },
    {
      id: "a26",
      clientId: "carla",
      client: "Carla Santos",
      date: "2026-09-18",
      time: "09:30",
      status: "agendado",
      servicos: [
        { servicoId: "brow-lamination", nome: "Brow lamination", categoria: "Sobrancelhas", valorReferencia: 120, profissional: "Bruna" }
      ]
    },
    {
      id: "a25",
      clientId: "ana",
      client: "Ana Souza",
      date: "2026-09-18",
      time: "15:00",
      status: "agendado",
      servicos: [
        { servicoId: "manutencao-tip", nome: "Manutenção tip", categoria: "Unhas", valorReferencia: 130, profissional: "Bruna" }
      ]
    },
    {
      id: "a5",
      clientId: "maria",
      client: "Maria Silva",
      date: "2026-09-18",
      time: "15:00",
      status: "confirmado",
      servicos: [
        { servicoId: "volume-russo", nome: "Volume russo", categoria: "Cílios", valorReferencia: 180, profissional: "Amanda" }
      ]
    },
    {
      id: "a29",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-20",
      time: "09:30",
      status: "agendado",
      servicos: [
        { servicoId: "banho-de-gel", nome: "Banho de gel", categoria: "Unhas", valorReferencia: 80, profissional: "Bruna" }
      ]
    },
    {
      id: "a6",
      clientId: "ana",
      client: "Ana Souza",
      date: "2026-09-20",
      time: "09:30",
      status: "agendado",
      servicos: [
        { servicoId: "manutencao-molde-f1", nome: "Manutenção molde F1", categoria: "Unhas", valorReferencia: 120, profissional: "Amanda" }
      ]
    },
    {
      id: "h2",
      clientId: "maria",
      client: "Maria Silva",
      date: "2026-09-08",
      time: "15:00",
      status: "concluido",
      servicos: [
        { servicoId: "lash-lifting", nome: "Lash lifting", categoria: "Cílios", valorReferencia: 100, profissional: "Amanda" }
      ]
    },
    {
      id: "h4",
      clientId: "carla",
      client: "Carla Santos",
      date: "2026-09-10",
      time: "09:00",
      status: "concluido",
      servicos: [
        { servicoId: "lash-lifting", nome: "Lash lifting", categoria: "Cílios", valorReferencia: 100, profissional: "Amanda" }
      ]
    },
    {
      id: "h3",
      clientId: "ana",
      client: "Ana Souza",
      date: "2026-09-10",
      time: "09:00",
      status: "concluido",
      servicos: [
        { servicoId: "alongamento-gel-na-tip", nome: "Alongamento gel na tip", categoria: "Unhas", valorReferencia: 160, profissional: "Bruna" }
      ]
    },
    {
      id: "h5",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-11",
      time: "14:30",
      status: "concluido",
      servicos: [
        { servicoId: "mao", nome: "Mão", categoria: "Unhas", valorReferencia: 35, profissional: "Bruna" }
      ]
    },
    {
      id: "h1",
      clientId: "maria",
      client: "Maria Silva",
      date: "2026-09-11",
      time: "14:30",
      status: "concluido",
      servicos: [
        { servicoId: "volume-brasileiro", nome: "Volume brasileiro", categoria: "Cílios", valorReferencia: 150, profissional: "Amanda" }
      ]
    },
    {
      id: "h-lash-janela",
      clientId: "maria",
      client: "Maria Silva",
      date: "2026-08-20",
      time: "10:00",
      status: "concluido",
      servicos: [
        { servicoId: "lash-lifting", nome: "Lash lifting", categoria: "Cílios", valorReferencia: 100, profissional: "Amanda" }
      ]
    },
    {
      id: "h-vol-vencida",
      clientId: "ana",
      client: "Ana Souza",
      date: "2026-08-20",
      time: "11:00",
      status: "concluido",
      servicos: [
        { servicoId: "volume-brasileiro", nome: "Volume brasileiro", categoria: "Cílios", valorReferencia: 150, profissional: "Amanda" }
      ]
    }
  ],
  services: (function () {
    const unhas = ["Bruna", "Amanda"];
    const cilios = ["Amanda"];
    const sobra = ["Bruna", "Amanda"];
    function money(value, from) {
      const text = "R$ " + Number(value).toFixed(2).replace(".", ",");
      return from ? "A partir de " + text : text;
    }
    function subgrupoOf(category, name, group) {
      if (category === "Unhas") {
        if (["Mão", "Pé", "Mão e pé"].includes(name)) return "Mãos e pés";
        if (["Alongamento gel na tip", "Soft gel", "Molde F1", "Blindagem", "Banho de gel"].includes(name)) {
          return "Alongamentos";
        }
        if (name.indexOf("Manutenção") === 0) return "Manutenções";
        if (name.indexOf("Spa") === 0) return "Spa dos pés";
        return "Extras";
      }
      if (category === "Cílios") {
        return name === "Lash lifting" ? "Outros" : "Alongamentos";
      }
      if (category === "Sobrancelhas") return "Design";
      return group || "Outros";
    }
    function observacaoOf(name, from) {
      if (!from) return "";
      if (name === "Postiça realista") return "Valor pode variar conforme tamanho e material.";
      if (name === "Nail art") return "Nail art varia conforme complexidade.";
      return "Valor pode variar conforme complexidade.";
    }
    function item(id, name, group, category, value, pros, from) {
      return {
        id,
        name,
        nome: name,
        group,
        subgrupo: subgrupoOf(category, name, group),
        categoria: category,
        valorReferencia: value,
        tipoPreco: from ? "a_partir_de" : "fixo",
        fromPrice: Boolean(from),
        price: money(value, from),
        duracaoMinutos: Math.round(Number(STUDIO_DEMO_DURATIONS[id]) || 60),
        profissionaisHabilitadas: pros.slice(),
        observacoes: observacaoOf(name, from),
        ativo: true
      };
    }
    return [
      item("mao", "Mão", "UNHAS SIMPLES", "Unhas", 35, unhas),
      item("pe", "Pé", "UNHAS SIMPLES", "Unhas", 40, unhas),
      item("mao-e-pe", "Mão e pé", "UNHAS SIMPLES", "Unhas", 70, unhas),
      item("alongamento-gel-na-tip", "Alongamento gel na tip", "ALONGAMENTOS", "Unhas", 160, unhas),
      item("soft-gel", "Soft gel", "ALONGAMENTOS", "Unhas", 120, unhas),
      item("molde-f1", "Molde F1", "ALONGAMENTOS", "Unhas", 150, unhas),
      item("blindagem", "Blindagem", "ALONGAMENTOS", "Unhas", 70, unhas),
      item("banho-de-gel", "Banho de gel", "ALONGAMENTOS", "Unhas", 80, unhas),
      item("manutencao-tip", "Manutenção tip", "EXTRAS", "Unhas", 130, unhas),
      item("manutencao-soft", "Manutenção soft", "EXTRAS", "Unhas", 90, unhas),
      item("manutencao-molde-f1", "Manutenção molde F1", "EXTRAS", "Unhas", 120, unhas),
      item("esmaltacao-gel-mao", "Esmaltação em gel — mão", "EXTRAS", "Unhas", 65, unhas),
      item("esmaltacao-gel-pe", "Esmaltação em gel — pé", "EXTRAS", "Unhas", 70, unhas),
      item("esmaltacao-gel-mao-pe", "Esmaltação em gel — mão + pé", "EXTRAS", "Unhas", 120, unhas),
      item("nail-art", "Nail art", "EXTRAS", "Unhas", 50, unhas, true),
      item("francesinha", "Francesinha", "EXTRAS", "Unhas", 10, unhas),
      item("remocao-alongamentos", "Remoção de alongamentos", "EXTRAS", "Unhas", 60, unhas),
      item("decoracao", "Decoração", "EXTRAS", "Unhas", 50, unhas, true),
      item("postica-realista", "Postiça realista", "EXTRAS", "Unhas", 80, unhas, true),
      item("spa-dos-pes", "Spa dos pés", "SPA DOS PÉS", "Unhas", 80, unhas),
      item("spa-esmaltacao-gel", "Spa + esmaltação em gel", "SPA DOS PÉS", "Unhas", 100, unhas),
      item("alongamento-light", "Alongamento light", "CÍLIOS", "Cílios", 100, cilios),
      item("fio-a-fio", "Fio a fio", "CÍLIOS", "Cílios", 120, cilios),
      item("volume-brasileiro", "Volume brasileiro", "CÍLIOS", "Cílios", 150, cilios),
      item("volume-hibrido", "Volume híbrido", "CÍLIOS", "Cílios", 150, cilios),
      item("anime", "Anime", "CÍLIOS", "Cílios", 170, cilios),
      item("volume-russo", "Volume russo", "CÍLIOS", "Cílios", 180, cilios),
      item("lash-lifting", "Lash lifting", "CÍLIOS", "Cílios", 100, cilios),
      item("design", "Design", "SOBRANCELHAS", "Sobrancelhas", 40, sobra),
      item("henna", "Henna", "SOBRANCELHAS", "Sobrancelhas", 60, sobra),
      item("brow-lamination", "Brow lamination", "SOBRANCELHAS", "Sobrancelhas", 120, sobra)
    ];
  })()
};

window.StudioData.serviceById = function (id) {
  return (this.services || []).find((item) => item.id === id) || null;
};

window.StudioData.SERVICE_ALIASES = {
  "design de sobrancelhas": "design",
  "sobrancelhas henna": "henna",
  "alongamento em gel": "alongamento-gel-na-tip",
  "alongamento fio a fio": "fio-a-fio",
  "spa dos pés + esmaltação em gel": "spa-esmaltacao-gel",
  "mão + pé": "mao-e-pe",
  "manutencao de cilios": "lash-lifting",
  "manutenção de cílios": "lash-lifting"
};

window.StudioData.serviceByName = function (name) {
  const key = String(name || "").trim().toLowerCase();
  const aliased = this.SERVICE_ALIASES[key];
  if (aliased) return this.serviceById(aliased);
  return (
    (this.services || []).find(
      (item) => item.id === name || item.name.toLowerCase() === key || item.nome.toLowerCase() === key
    ) || null
  );
};

window.StudioData.demoDuration = function (id) {
  const key = String(id || "");
  const mapped = this.demoDurations && this.demoDurations[key];
  const n = Math.round(Number(mapped));
  return Number.isFinite(n) && n > 0 ? n : 60;
};

window.STATUS_LABEL = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado"
};
