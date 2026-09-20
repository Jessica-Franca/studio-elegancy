(function () {
  const KEY = "studioElegancy_manutencoes";
  const TODAY = window.StudioState && window.StudioState.today;
  const JANELA_DIAS = 7;
  const STATUS_LABEL = {
    pendente: "Pendente",
    agendada: "Agendada",
    concluida: "Concluída"
  };
  const FOLLOW_LABEL = {
    sem_contato: "Sem contato",
    aguardando_retorno: "Aguardando retorno",
    encerrado: "Encerrado"
  };
  const RESULT_OPTIONS = [
    { id: "vai_retornar", label: "Vai retornar", follow: "aguardando_retorno" },
    { id: "nao_vai_retornar", label: "Não vai retornar", follow: "encerrado" },
    { id: "nao_respondeu", label: "Não respondeu", follow: "aguardando_retorno" },
    { id: "falar_depois", label: "Pediu para falar depois", follow: "aguardando_retorno" },
    { id: "outro", label: "Outro", follow: "aguardando_retorno" }
  ];
  const RESULT_LABEL = RESULT_OPTIONS.reduce((map, item) => {
    map[item.id] = item.label;
    return map;
  }, {});
  const LOOSE_MAINT = {
    "manutencao-tip": "alongamento-gel-na-tip",
    "manutencao-soft": "soft-gel",
    "manutencao-molde-f1": "molde-f1"
  };

  function todayIso() {
    return (window.StudioState && window.StudioState.today) || TODAY;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function readList() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function fold(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function addDays(iso, days) {
    const [year, month, day] = String(iso).split("-").map(Number);
    const dt = new Date(Date.UTC(year, month - 1, day + Number(days || 0)));
    return dt.toISOString().slice(0, 10);
  }

  function addMonths(iso, months) {
    const [year, month, day] = String(iso).split("-").map(Number);
    const base = new Date(Date.UTC(year, month - 1 + Number(months || 0), 1));
    const last = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
    base.setUTCDate(Math.min(day, last));
    return base.toISOString().slice(0, 10);
  }

  function addWeeks(iso, weeks) {
    return addDays(iso, Number(weeks || 0) * 7);
  }

  function addPrazo(iso, valor, unidade) {
    if (!iso || !valor) return iso;
    if (unidade === "dias") return addDays(iso, valor);
    if (unidade === "semanas") return addWeeks(iso, valor);
    return addMonths(iso, valor);
  }

  function diffDays(from, to) {
    const a = new Date(from + "T00:00:00Z").getTime();
    const b = new Date(to + "T00:00:00Z").getTime();
    return Math.round((b - a) / 86400000);
  }

  function nextId(list) {
    let max = 0;
    (list || []).forEach((item) => {
      const match = String(item.id || "").match(/^MAN(\d+)$/i);
      if (match) max = Math.max(max, Number(match[1]));
    });
    return "MAN" + String(max + 1).padStart(3, "0");
  }

  function catalogOf(ref) {
    if (window.StudioState && typeof window.StudioState.service === "function") {
      const live = window.StudioState.service(ref);
      if (live) return live;
    }
    return window.StudioData ? window.StudioData.serviceById(ref) || window.StudioData.serviceByName(ref) : null;
  }

  function clientName(id) {
    const client = window.StudioState && window.StudioState.client(id);
    return client ? client.name : "";
  }

  function clone(item) {
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  function timingOf(prevista, realizada) {
    if (!prevista || !realizada) return { antecipada: false, naData: false, atrasada: false, timing: "" };
    if (realizada < prevista) return { antecipada: true, naData: false, atrasada: false, timing: "antecipada" };
    if (realizada > prevista) return { antecipada: false, naData: false, atrasada: true, timing: "atrasada" };
    return { antecipada: false, naData: true, atrasada: false, timing: "na-data" };
  }

  function timingLabel(item) {
    if (item.status !== "concluida") return STATUS_LABEL[item.status] || item.status;
    if (item.antecipada) return "Realizada antecipadamente";
    if (item.atrasada) return "Realizada com atraso";
    if (item.naData) return "Realizada na data";
    return "Concluída";
  }

  function normalizeContact(raw, index) {
    const item = raw || {};
    return {
      id: String(item.id || "CT" + String((index || 0) + 1).padStart(3, "0")),
      data: item.data || "",
      resultado: item.resultado || "",
      observacao: item.observacao || "",
      dataInformadaCliente: item.dataInformadaCliente || "",
      proximaAcao: item.proximaAcao || ""
    };
  }

  function followFromContacts(contacts, fallback) {
    if (!contacts.length) return "sem_contato";
    const last = contacts[contacts.length - 1];
    const option = RESULT_OPTIONS.find((item) => item.id === last.resultado);
    return option ? option.follow : fallback || "aguardando_retorno";
  }

  function normalize(raw) {
    const item = raw || {};
    const contatos = Array.isArray(item.contatos) ? item.contatos.map(normalizeContact) : [];
    const follow = item.acompanhamentoStatus || followFromContacts(contatos, "sem_contato");
    return {
      id: String(item.id || ""),
      numero: Number(item.numero) || 1,
      clienteId: String(item.clienteId || ""),
      servicoOriginalId: String(item.servicoOriginalId || ""),
      servicoOriginalNome: item.servicoOriginalNome || "",
      servicoManutencaoId: String(item.servicoManutencaoId || ""),
      servicoManutencaoNome: item.servicoManutencaoNome || (item.servicoManutencaoId ? item.servicoOriginalNome : "Manutenção"),
      profissional: item.profissional || item.profissionalOriginal || "",
      profissionalOriginal: item.profissionalOriginal || item.profissional || "",
      agendamentoOrigemId: String(item.agendamentoOrigemId || ""),
      agendamentoConclusaoId: String(item.agendamentoConclusaoId || ""),
      agendamentoAgendadoId: String(item.agendamentoAgendadoId || ""),
      dataAtendimentoOrigem: item.dataAtendimentoOrigem || "",
      dataPrevista: item.dataPrevista || "",
      realizadaEm: item.realizadaEm || "",
      status: item.status || "pendente",
      antecipada: Boolean(item.antecipada),
      atrasada: Boolean(item.atrasada),
      naData: Boolean(item.naData),
      manutencaoAnteriorId: String(item.manutencaoAnteriorId || ""),
      manutencaoOrigemId: String(item.manutencaoOrigemId || item.id || ""),
      observacoes: item.observacoes || "",
      acompanhamentoStatus: FOLLOW_LABEL[follow] ? follow : "sem_contato",
      contatos,
      criadoEm: item.criadoEm || nowIso(),
      atualizadoEm: item.atualizadoEm || nowIso()
    };
  }

  let items = readList().map(normalize).filter((item) => item.id);

  (function migrateLooseCycles() {
    let changed = false;
    items.forEach((item) => {
      const mappedMaint = LOOSE_MAINT[item.servicoManutencaoId];
      const mappedOrig = LOOSE_MAINT[item.servicoOriginalId];
      if (mappedMaint) {
        item.servicoOriginalId = item.servicoOriginalId || mappedMaint;
        item.servicoManutencaoId = mappedMaint;
        changed = true;
      }
      if (mappedOrig) {
        item.servicoOriginalId = mappedOrig;
        changed = true;
      }
      if (item.servicoOriginalId && !item.servicoManutencaoId) {
        item.servicoManutencaoId = item.servicoOriginalId;
        changed = true;
      }
    });
    if (changed) localStorage.setItem(KEY, JSON.stringify(items));
  })();

  function ensureDemoClients() {
    if (!window.StudioState || typeof window.StudioState.addClient !== "function") return;
    [
      { id: "patricia", name: "Patricia Lima", phone: "(11) 95555-1111", whatsapp: "(11) 95555-1111" },
      { id: "fernanda", name: "Fernanda Costa", phone: "(11) 95555-2222", whatsapp: "(11) 95555-2222" }
    ].forEach((row) => {
      if (window.StudioState.client(row.id)) return;
      window.StudioState.addClient(row);
    });
  }

  function seedDemoAppointment(fields) {
    if (!window.StudioState || typeof window.StudioState.addAppointment !== "function") return;
    if (window.StudioState.appointment(fields.id)) return;
    window.StudioState.addAppointment(fields, { skipConflict: true });
  }

  function seedDemoReturns() {
    ensureDemoClients();
    const stamp = nowIso();
    const demo = [
      {
        id: "RTDEMO01",
        clienteId: "maria",
        servicoOriginalId: "fio-a-fio",
        servicoOriginalNome: "Fio a Fio",
        servicoManutencaoId: "fio-a-fio",
        servicoManutencaoNome: "Manutenção — 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-09-05",
        dataAtendimentoOrigem: "2026-08-21",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO02",
        clienteId: "ana",
        servicoOriginalId: "volume-brasileiro",
        servicoOriginalNome: "Brasileiro",
        servicoManutencaoId: "volume-brasileiro",
        servicoManutencaoNome: "Manutenção — até 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-09-10",
        dataAtendimentoOrigem: "2026-08-26",
        status: "pendente",
        acompanhamentoStatus: "aguardando_retorno",
        contatos: [
          {
            id: "CT001",
            data: "2026-09-11",
            resultado: "vai_retornar",
            observacao: "Vou voltar semana que vem.",
            dataInformadaCliente: "2026-09-20",
            proximaAcao: "2026-09-20"
          }
        ]
      },
      {
        id: "RTDEMO03",
        clienteId: "carla",
        servicoOriginalId: "alongamento-light",
        servicoOriginalNome: "Light",
        servicoManutencaoId: "alongamento-light",
        servicoManutencaoNome: "Manutenção — 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-09-25",
        dataAtendimentoOrigem: "2026-09-10",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO04",
        clienteId: "juliana",
        servicoOriginalId: "volume-hibrido",
        servicoOriginalNome: "Híbrido",
        servicoManutencaoId: "volume-hibrido",
        servicoManutencaoNome: "Manutenção — até 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-09-22",
        dataAtendimentoOrigem: "2026-09-07",
        status: "agendada",
        agendamentoAgendadoId: "rtdemo-ap-04",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO05",
        clienteId: "patricia",
        servicoOriginalId: "volume-russo",
        servicoOriginalNome: "Russo",
        servicoManutencaoId: "volume-russo",
        servicoManutencaoNome: "Manutenção — até 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-08-20",
        dataAtendimentoOrigem: "2026-08-05",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO06",
        clienteId: "fernanda",
        servicoOriginalId: "anime",
        servicoOriginalNome: "Anime",
        servicoManutencaoId: "anime",
        servicoManutencaoNome: "Manutenção — até 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-09-12",
        dataAtendimentoOrigem: "2026-08-28",
        status: "pendente",
        acompanhamentoStatus: "aguardando_retorno",
        contatos: [
          {
            id: "CT001",
            data: "2026-09-13",
            resultado: "vai_retornar",
            observacao: "Quer remarcar o Anime na próxima semana.",
            dataInformadaCliente: "2026-09-27",
            proximaAcao: "2026-09-22"
          }
        ]
      },
      {
        id: "RTDEMO07",
        clienteId: "maria",
        servicoOriginalId: "efeito-elegancy",
        servicoOriginalNome: "Efeito Elegancy",
        servicoManutencaoId: "efeito-elegancy",
        servicoManutencaoNome: "Manutenção — até 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-09-24",
        dataAtendimentoOrigem: "2026-09-09",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO08",
        clienteId: "ana",
        servicoOriginalId: "fio-a-fio",
        servicoOriginalNome: "Fio a Fio",
        servicoManutencaoId: "fio-a-fio",
        servicoManutencaoNome: "Manutenção — 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-08-02",
        dataAtendimentoOrigem: "2026-07-18",
        status: "pendente",
        acompanhamentoStatus: "encerrado",
        contatos: [
          {
            id: "CT001",
            data: "2026-08-04",
            resultado: "nao_vai_retornar",
            observacao: "Disse que não quer manter os cílios por enquanto.",
            proximaAcao: ""
          }
        ]
      },
      {
        id: "RTDEMO09",
        clienteId: "carla",
        servicoOriginalId: "volume-brasileiro",
        servicoOriginalNome: "Brasileiro",
        servicoManutencaoId: "volume-brasileiro",
        servicoManutencaoNome: "Manutenção — até 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-06-18",
        dataAtendimentoOrigem: "2026-06-03",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO10",
        clienteId: "juliana",
        servicoOriginalId: "alongamento-light",
        servicoOriginalNome: "Light",
        servicoManutencaoId: "alongamento-light",
        servicoManutencaoNome: "Manutenção — 15 dias",
        profissional: "Amanda",
        dataPrevista: "2026-07-12",
        dataAtendimentoOrigem: "2026-06-27",
        status: "pendente",
        acompanhamentoStatus: "aguardando_retorno",
        contatos: [
          {
            id: "CT001",
            data: "2026-07-14",
            resultado: "nao_respondeu",
            observacao: "Ligação sem resposta.",
            proximaAcao: "2026-07-18"
          },
          {
            id: "CT002",
            data: "2026-07-18",
            resultado: "vai_retornar",
            observacao: "Pediu para falar depois das férias.",
            dataInformadaCliente: "2026-09-28",
            proximaAcao: "2026-09-22"
          }
        ]
      },
      {
        id: "RTDEMO11",
        clienteId: "maria",
        servicoOriginalId: "molde-f1",
        servicoOriginalNome: "Molde F1",
        servicoManutencaoId: "molde-f1",
        servicoManutencaoNome: "Manutenção Molde F1",
        profissional: "Bruna",
        dataPrevista: "2026-09-08",
        dataAtendimentoOrigem: "2026-06-08",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO12",
        clienteId: "ana",
        servicoOriginalId: "soft-gel",
        servicoOriginalNome: "Soft Gel",
        servicoManutencaoId: "soft-gel",
        servicoManutencaoNome: "Manutenção Soft Gel",
        profissional: "Bruna",
        dataPrevista: "2026-09-26",
        dataAtendimentoOrigem: "2026-06-26",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO13",
        clienteId: "carla",
        servicoOriginalId: "alongamento-gel-na-tip",
        servicoOriginalNome: "Alongamento Gel na Tip",
        servicoManutencaoId: "alongamento-gel-na-tip",
        servicoManutencaoNome: "Manutenção Tip",
        profissional: "Bruna",
        dataPrevista: "2026-09-14",
        dataAtendimentoOrigem: "2026-06-14",
        status: "pendente",
        acompanhamentoStatus: "aguardando_retorno",
        contatos: [
          {
            id: "CT001",
            data: "2026-09-15",
            resultado: "vai_retornar",
            observacao: "Confirmou a manutenção da tip para o fim do mês.",
            dataInformadaCliente: "2026-09-28",
            proximaAcao: "2026-09-25"
          }
        ]
      },
      {
        id: "RTDEMO14",
        clienteId: "juliana",
        servicoOriginalId: "molde-f1",
        servicoOriginalNome: "Molde F1",
        servicoManutencaoId: "molde-f1",
        servicoManutencaoNome: "Manutenção Molde F1",
        profissional: "Bruna",
        dataPrevista: "2026-09-20",
        dataAtendimentoOrigem: "2026-06-20",
        status: "agendada",
        agendamentoAgendadoId: "rtdemo-ap-14",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO15",
        clienteId: "patricia",
        servicoOriginalId: "alongamento-gel-na-tip",
        servicoOriginalNome: "Alongamento Gel na Tip",
        servicoManutencaoId: "alongamento-gel-na-tip",
        servicoManutencaoNome: "Manutenção Tip",
        profissional: "Bruna",
        dataPrevista: "2026-08-28",
        dataAtendimentoOrigem: "2026-05-28",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO16",
        clienteId: "fernanda",
        servicoOriginalId: "molde-f1",
        servicoOriginalNome: "Molde F1",
        servicoManutencaoId: "molde-f1",
        servicoManutencaoNome: "Manutenção Molde F1",
        profissional: "Bruna",
        dataPrevista: "2026-07-30",
        dataAtendimentoOrigem: "2026-04-30",
        status: "pendente",
        acompanhamentoStatus: "encerrado",
        contatos: [
          {
            id: "CT001",
            data: "2026-08-01",
            resultado: "nao_vai_retornar",
            observacao: "Vai deixar crescer natural por uns meses.",
            proximaAcao: ""
          }
        ]
      },
      {
        id: "RTDEMO17",
        clienteId: "maria",
        servicoOriginalId: "soft-gel",
        servicoOriginalNome: "Soft Gel",
        servicoManutencaoId: "soft-gel",
        servicoManutencaoNome: "Manutenção Soft Gel",
        profissional: "Bruna",
        dataPrevista: "2026-09-23",
        dataAtendimentoOrigem: "2026-06-23",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO18",
        clienteId: "ana",
        servicoOriginalId: "alongamento-gel-na-tip",
        servicoOriginalNome: "Alongamento Gel na Tip",
        servicoManutencaoId: "alongamento-gel-na-tip",
        servicoManutencaoNome: "Manutenção Tip",
        profissional: "Bruna",
        dataPrevista: "2026-06-22",
        dataAtendimentoOrigem: "2026-03-22",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      },
      {
        id: "RTDEMO19",
        clienteId: "carla",
        servicoOriginalId: "molde-f1",
        servicoOriginalNome: "Molde F1",
        servicoManutencaoId: "molde-f1",
        servicoManutencaoNome: "Manutenção Molde F1",
        profissional: "Bruna",
        dataPrevista: "2026-07-16",
        dataAtendimentoOrigem: "2026-04-16",
        status: "pendente",
        acompanhamentoStatus: "aguardando_retorno",
        contatos: [
          {
            id: "CT001",
            data: "2026-07-17",
            resultado: "falar_depois",
            observacao: "Pediu para falar depois da viagem.",
            proximaAcao: "2026-09-21"
          }
        ]
      },
      {
        id: "RTDEMO20",
        clienteId: "juliana",
        servicoOriginalId: "soft-gel",
        servicoOriginalNome: "Soft Gel",
        servicoManutencaoId: "soft-gel",
        servicoManutencaoNome: "Manutenção Soft Gel",
        profissional: "Bruna",
        dataPrevista: "2026-08-12",
        dataAtendimentoOrigem: "2026-05-12",
        status: "pendente",
        acompanhamentoStatus: "sem_contato"
      }
    ];
    let added = false;
    demo.forEach((row, index) => {
      if (find(row.id)) return;
      items.push(
        normalize({
          ...row,
          numero: row.numero || index + 1,
          profissionalOriginal: row.profissional,
          criadoEm: stamp,
          atualizadoEm: stamp
        })
      );
      added = true;
    });
    if (added) persist();
    seedDemoAppointment({
      id: "rtdemo-ap-04",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-22",
      time: "14:00",
      status: "agendado",
      servicos: [
        {
          servicoId: "volume-hibrido",
          nome: "Híbrido",
          categoria: "Cílios",
          valorReferencia: 83,
          modalidade: "manutencao",
          profissional: "Amanda"
        }
      ],
      formaPagamento: "pix",
      manutencaoId: "RTDEMO04"
    });
    seedDemoAppointment({
      id: "rtdemo-ap-14",
      clientId: "juliana",
      client: "Juliana Oliveira",
      date: "2026-09-20",
      time: "15:30",
      status: "agendado",
      servicos: [
        {
          servicoId: "molde-f1",
          nome: "Molde F1",
          categoria: "Unhas",
          valorReferencia: 120,
          modalidade: "manutencao",
          profissional: "Bruna"
        }
      ],
      formaPagamento: "pix",
      manutencaoId: "RTDEMO14"
    });
  }

  seedDemoReturns();
  let lastStatus = {};
  let pendingChoice = null;
  let bootstrapped = false;

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("manutencoes:changed"));
  }

  function find(id) {
    return items.find((item) => item.id === String(id)) || null;
  }

  function captureStatus() {
    lastStatus = {};
    if (!window.StudioState) return;
    window.StudioState.list().forEach((appt) => {
      lastStatus[appt.id] = appt.status;
    });
  }

  function relatedToLine(maint, line) {
    const lineId = String(line.servicoId || "");
    const mapped = LOOSE_MAINT[lineId] || lineId;
    const lineName = fold(line.nome);
    const isMaintLine =
      line.modalidade === "manutencao" ||
      Boolean(LOOSE_MAINT[lineId]) ||
      fold(line.nome).indexOf("manutencao") === 0;
    if (!isMaintLine) return false;
    return (
      maint.servicoManutencaoId === lineId ||
      maint.servicoManutencaoId === mapped ||
      maint.servicoOriginalId === lineId ||
      maint.servicoOriginalId === mapped ||
      fold(maint.servicoManutencaoNome) === lineName ||
      fold(maint.servicoOriginalNome) === lineName
    );
  }

  function openCandidates(appt) {
    const lines = appt.servicos || [];
    return items.filter((item) => {
      if (String(item.clienteId) !== String(appt.clientId)) return false;
      if (item.status !== "pendente" && item.status !== "agendada") return false;
      return lines.some((line) => relatedToLine(item, line));
    });
  }

  function pickClosest(candidates, date) {
    if (!candidates.length) return [];
    const scored = candidates
      .map((item) => ({ item, dist: Math.abs(diffDays(item.dataPrevista || date, date)) }))
      .sort((a, b) => a.dist - b.dist || String(a.item.dataPrevista).localeCompare(String(b.item.dataPrevista)));
    const best = scored[0].dist;
    return scored.filter((row) => row.dist === best).map((row) => row.item);
  }

  function groupByService(candidates) {
    const map = {};
    candidates.forEach((item) => {
      const key = item.servicoManutencaoId || item.servicoOriginalId;
      (map[key] = map[key] || []).push(item);
    });
    return map;
  }

  function fulfill(id, appt) {
    const item = find(id);
    if (!item || item.status === "concluida") return null;
    const realizada = appt.date;
    const marks = timingOf(item.dataPrevista, realizada);
    item.status = "concluida";
    item.realizadaEm = realizada;
    item.agendamentoConclusaoId = appt.id;
    item.antecipada = marks.antecipada;
    item.atrasada = marks.atrasada;
    item.naData = marks.naData;
    item.atualizadoEm = nowIso();
    persist();
    return clone(item);
  }

  function reopenIfCancelled(apptId) {
    let changed = false;
    items.forEach((item) => {
      if (item.agendamentoAgendadoId === String(apptId) && item.status === "agendada") {
        item.status = "pendente";
        item.agendamentoAgendadoId = "";
        item.atualizadoEm = nowIso();
        changed = true;
      }
    });
    if (changed) persist();
  }

  function markAgendada(id, apptId) {
    const item = find(id);
    if (!item || item.status === "concluida") return;
    item.status = "agendada";
    item.agendamentoAgendadoId = String(apptId);
    item.atualizadoEm = nowIso();
    persist();
  }

  function alreadyGenerated(agendamentoId, servicoId) {
    return items.some(
      (item) =>
        item.agendamentoOrigemId === String(agendamentoId) &&
        (item.servicoOriginalId === String(servicoId) || item.servicoManutencaoId === String(servicoId))
    );
  }

  function lineageRoot(previousId) {
    if (!previousId) return "";
    const prev = find(previousId);
    return prev ? prev.manutencaoOrigemId || prev.id : previousId;
  }

  function nextNumero(origemId) {
    const count = items.filter((item) => (item.manutencaoOrigemId || item.id) === origemId).length;
    return count + 1;
  }

  function createCycle(fields) {
    const id = nextId(items);
    const origem = fields.manutencaoOrigemId || id;
    const record = normalize({
      ...fields,
      id,
      numero: fields.numero || nextNumero(origem === id ? "" : origem) || 1,
      manutencaoOrigemId: origem,
      status: "pendente",
      criadoEm: nowIso(),
      atualizadoEm: nowIso()
    });
    if (origem === id) record.manutencaoOrigemId = id;
    items.push(record);
    persist();
    return clone(record);
  }

  function previousForLine(line, previousRecords) {
    const list = Array.isArray(previousRecords)
      ? previousRecords
      : previousRecords
        ? [previousRecords]
        : [];
    return list.find((prev) => {
      if (!prev) return false;
      if (relatedToLine(prev, line)) return true;
      const lineId = String(line.servicoId || "");
      return prev.servicoOriginalId === lineId || prev.servicoManutencaoId === lineId;
    }) || null;
  }

  function generateFromAppointment(appt, previousRecords) {
    const lines = appt.servicos || [];
    const created = [];
    lines.forEach((line) => {
      const catalog = catalogOf(line.servicoId) || catalogOf(line.nome);
      if (!catalog || catalog.exigeManutencao !== true || !catalog.prazoManutencao) return;
      if (alreadyGenerated(appt.id, catalog.id)) return;
      const maintName =
        catalog.manutencaoNome ||
        (catalog.manutencaoRegra ? "Manutenção — " + catalog.manutencaoRegra : "Manutenção — " + catalog.nome);
      const prev = previousForLine(line, previousRecords);
      const origemId = prev ? prev.manutencaoOrigemId || prev.id : "";
      const profissional = line.profissional || (catalog.profissionaisHabilitadas || [])[0] || "";
      created.push(
        createCycle({
          clienteId: appt.clientId,
          servicoOriginalId: catalog.id,
          servicoOriginalNome: catalog.nome,
          servicoManutencaoId: catalog.id,
          servicoManutencaoNome: maintName,
          profissional,
          profissionalOriginal: profissional,
          agendamentoOrigemId: appt.id,
          dataAtendimentoOrigem: appt.date,
          dataPrevista: addPrazo(appt.date, catalog.prazoManutencao, catalog.prazoUnidade),
          prazoManutencao: catalog.prazoManutencao,
          prazoUnidade: catalog.prazoUnidade,
          manutencaoAnteriorId: prev ? prev.id : "",
          manutencaoOrigemId: origemId,
          numero: origemId ? nextNumero(origemId) : 1
        })
      );
    });
    return created;
  }

  function uniqueFulfillTargets(appt) {
    const grouped = groupByService(openCandidates(appt));
    const chosen = [];
    const ambiguous = [];
    Object.keys(grouped).forEach((key) => {
      const closest = pickClosest(grouped[key], appt.date);
      if (closest.length === 1) chosen.push(closest[0]);
      else if (closest.length > 1) ambiguous.push(...closest);
    });
    return { chosen, ambiguous };
  }

  function afterConcluido(appt) {
    if (appt.manutencaoId && find(appt.manutencaoId)) {
      const done = fulfill(appt.manutencaoId, appt);
      generateFromAppointment(appt, done ? [done] : []);
      return;
    }
    const { chosen, ambiguous } = uniqueFulfillTargets(appt);
    if (ambiguous.length) {
      askWhich(appt, ambiguous.concat(chosen));
      return;
    }
    const doneList = [];
    chosen.forEach((item) => {
      const done = fulfill(item.id, appt);
      if (done) doneList.push(done);
    });
    generateFromAppointment(appt, doneList);
  }

  function processAppointment(appt, previousStatus) {
    if (!appt) return;
    if (appt.status === "cancelado") {
      reopenIfCancelled(appt.id);
      return;
    }
    if (appt.status === "agendado" || appt.status === "confirmado") {
      if (appt.manutencaoId) markAgendada(appt.manutencaoId, appt.id);
      return;
    }
    if (appt.status !== "concluido") return;
    if (previousStatus === "concluido") {
      generateFromAppointment(appt, []);
      return;
    }
    afterConcluido(appt);
  }

  function ensureModals() {
    if (!document.getElementById("modal-maint-pick")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
      <div class="modal-backdrop modal-backdrop--top" id="modal-maint-pick">
        <section class="modal" role="dialog" aria-labelledby="maint-pick-title">
          <h2 class="modal-title" id="maint-pick-title">Qual manutenção este atendimento encerra?</h2>
          <p class="hint" id="maint-pick-text">Há mais de uma manutenção pendente para esta cliente e este serviço. Escolha a correta para não misturar os ciclos.</p>
          <div id="maint-pick-list" class="maint-pick-list"></div>
          <div class="btn-row" style="justify-content:flex-end;margin-top:18px">
            <button class="btn btn--secondary" id="maint-pick-none" type="button">Não está ligada a nenhuma</button>
          </div>
        </section>
      </div>
    `
      );
      document.getElementById("maint-pick-none").addEventListener("click", () => resolveChoice(null));
      document.getElementById("maint-pick-list").addEventListener("click", (event) => {
        const btn = event.target.closest("[data-maint-pick]");
        if (!btn) return;
        resolveChoice(btn.dataset.maintPick);
      });
    }
    if (document.getElementById("modal-maint-contact")) {
      ensureHistoryModal();
      return;
    }
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="modal-backdrop modal-backdrop--over" id="modal-maint-contact">
        <section class="modal" role="dialog" aria-labelledby="maint-contact-title">
          <h2 class="modal-title" id="maint-contact-title">Registrar contato</h2>
          <p class="hint" id="maint-contact-hint">A data prevista da manutenção não muda. Este registro é o acompanhamento.</p>
          <form class="form-grid" id="maint-contact-form">
            <input type="hidden" id="maint-contact-id">
            <div class="field">
              <label for="maint-contact-date">Data do contato</label>
              <input class="input" id="maint-contact-date" autocomplete="off">
            </div>
            <div class="field">
              <label for="maint-contact-result">Resultado</label>
              <select class="select" id="maint-contact-result">
                ${RESULT_OPTIONS.map((item) => `<option value="${item.id}">${item.label}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="maint-contact-informed">Data informada pela cliente</label>
              <input class="input" id="maint-contact-informed" autocomplete="off">
              <p class="hint">Quando ela disse que pretende voltar. Isso não cria agendamento.</p>
            </div>
            <div class="field">
              <label for="maint-contact-next">Próxima ação</label>
              <input class="input" id="maint-contact-next" autocomplete="off">
              <p class="hint">Data para verificar de novo, se fizer sentido.</p>
            </div>
            <div class="field">
              <label for="maint-contact-note">Observação</label>
              <textarea class="textarea textarea--short" id="maint-contact-note" placeholder="O que a cliente disse, recado, combinado..."></textarea>
            </div>
            <div class="btn-row" style="justify-content:flex-end">
              <button class="btn btn--secondary" type="button" data-close-contact>Cancelar</button>
              <button class="btn btn--primary" type="submit">Salvar contato</button>
            </div>
          </form>
        </section>
      </div>
    `
    );
    document.getElementById("modal-maint-contact").addEventListener("click", (event) => {
      if (event.target.id === "modal-maint-contact" || event.target.closest("[data-close-contact]")) {
        closeContactForm();
      }
    });
    document.getElementById("maint-contact-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const id = document.getElementById("maint-contact-id").value;
      addContact(id, {
        data: document.getElementById("maint-contact-date").value,
        resultado: document.getElementById("maint-contact-result").value,
        dataInformadaCliente: document.getElementById("maint-contact-informed").value,
        proximaAcao: document.getElementById("maint-contact-next").value,
        observacao: document.getElementById("maint-contact-note").value
      });
      closeContactForm();
      if (window.toast) window.toast("Contato registrado.");
    });
    ensureHistoryModal();
  }

  function ensureHistoryModal() {
    if (document.getElementById("modal-return-history")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="modal-backdrop modal-backdrop--over" id="modal-return-history">
        <section class="modal modal--wide" role="dialog" aria-labelledby="return-history-title">
          <p class="kicker">Histórico do retorno</p>
          <h2 class="modal-title" id="return-history-title">Ciclo de manutenção</h2>
          <div id="return-history-body" class="stack" style="margin-top:16px"></div>
          <div class="btn-row" style="justify-content:flex-end;margin-top:18px">
            <button class="btn btn--secondary" type="button" data-close-return-history>Fechar</button>
          </div>
        </section>
      </div>
    `
    );
    document.getElementById("modal-return-history").addEventListener("click", (event) => {
      if (event.target.id === "modal-return-history" || event.target.closest("[data-close-return-history]")) {
        closeReturnHistory();
      }
    });
  }

  function closeReturnHistory() {
    document.getElementById("modal-return-history")?.classList.remove("is-open");
  }

  function apptSummaryMarkup(appt) {
    if (!appt) return `<p class="hint">Atendimento de origem não encontrado.</p>`;
    const svc = (appt.servicos || []).map((line) => line.nome).filter(Boolean).join(" · ") || appt.service || "Serviço";
    const pro = appt.professional || (appt.servicos || []).map((line) => line.profissional).filter(Boolean)[0] || "—";
    const status = window.statusLabel ? window.statusLabel(appt.status) : appt.status;
    const money = window.formatMoney ? window.formatMoney(appt.valorTotal || appt.valor || 0) : appt.valorTotal || appt.valor || "—";
    return `
      <p><strong>${esc(showDate(appt.date))}</strong> · ${esc(appt.time || "—")}</p>
      <p class="hint">${esc(svc)} · ${esc(pro)}</p>
      <p class="hint">${esc(status)} · ${esc(money)} · ${esc(paymentLabel(appt.formaPagamento))}</p>
    `;
  }

  function recentAppointmentsMarkup(clienteId) {
    if (!window.StudioState || typeof window.StudioState.byClient !== "function") return "";
    const rows = window.StudioState.byClient(clienteId)
      .slice()
      .sort((a, b) => String(b.date + b.time).localeCompare(String(a.date + a.time)))
      .slice(0, 5);
    if (!rows.length) return `<p class="hint">Nenhum atendimento recente.</p>`;
    return `
      <div class="agenda-table-wrap">
        <table class="agenda-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Horário</th>
              <th>Serviço</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((appt) => {
                const svc = (appt.servicos || []).map((line) => line.nome).filter(Boolean).join(" · ") || "—";
                const status = window.statusLabel ? window.statusLabel(appt.status) : appt.status;
                return `<tr class="agenda-row" data-appt="${esc(appt.id)}">
                  <td>${esc(showDate(appt.date))}</td>
                  <td>${esc(appt.time || "—")}</td>
                  <td>${esc(svc)}</td>
                  <td>${esc(status)}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function openReturnHistory(id) {
    const item = find(id);
    if (!item) return;
    ensureModals();
    const view = enriched(item);
    const sit = situationOf(item);
    const origin = originAppointment(item) || originCompleted(item);
    const completed = originCompleted(item);
    const name = view.clienteNome || clientName(item.clienteId);
    const body = document.getElementById("return-history-body");
    const title = document.getElementById("return-history-title");
    if (title) title.textContent = `Retorno de ${view.servicoOriginalNome || view.servicoNome} previsto para ${showDate(item.dataPrevista)}`;
    if (body) {
      body.innerHTML = `
        <div class="return-history-block">
          <h3>Cliente</h3>
          <p><a class="appt-name" href="clientes.html?cliente=${encodeURIComponent(item.clienteId)}#cliente=${encodeURIComponent(item.clienteId)}">${esc(name)}</a></p>
        </div>
        <div class="return-history-block">
          <h3>Serviço</h3>
          <p>${esc(view.servicoManutencaoNome || view.servicoNome || "—")}</p>
          <p class="hint">${esc(item.profissional || "—")}</p>
        </div>
        <div class="return-history-block">
          <h3>Atendimento que originou o retorno</h3>
          ${apptSummaryMarkup(origin)}
          ${!completed && origin ? `<p class="hint">Este atendimento não está concluído, então não entra como último atendimento da tabela.</p>` : ""}
        </div>
        <div class="return-history-block">
          <h3>Retorno</h3>
          <p>Previsto para ${esc(showDate(item.dataPrevista))}</p>
          <p class="hint">${situationPill(item)} · ${esc(sit.timingLabel)} · ${esc(sit.followLabel)}</p>
        </div>
        <div class="return-history-block">
          <h3>Follow-ups</h3>
          ${contactHistoryMarkup(view)}
        </div>
        <div class="return-history-block">
          <h3>Atendimentos recentes</h3>
          ${recentAppointmentsMarkup(item.clienteId)}
        </div>
      `;
    }
    document.getElementById("modal-return-history").classList.add("is-open");
  }

  function closeContactForm() {
    document.getElementById("modal-maint-contact")?.classList.remove("is-open");
  }

  function openContactForm(id) {
    const item = find(id);
    if (!item) return;
    ensureModals();
    document.getElementById("maint-contact-id").value = item.id;
    document.getElementById("maint-contact-date").value = window.labelDate ? window.labelDate(todayIso()) : todayIso();
    document.getElementById("maint-contact-result").value = "vai_retornar";
    document.getElementById("maint-contact-informed").value = "";
    document.getElementById("maint-contact-next").value = "";
    document.getElementById("maint-contact-note").value = "";
    const hint = document.getElementById("maint-contact-hint");
    if (hint) {
      hint.textContent = `${clientName(item.clienteId) || "Cliente"} · ${item.servicoManutencaoNome || item.servicoOriginalNome} · prevista ${showDate(item.dataPrevista)}. A data original não muda.`;
    }
    document.getElementById("modal-maint-contact").classList.add("is-open");
    if (window.enhanceDateField) {
      window.enhanceDateField(document.getElementById("maint-contact-date"));
      window.enhanceDateField(document.getElementById("maint-contact-informed"));
      window.enhanceDateField(document.getElementById("maint-contact-next"));
    }
  }

  function closeContactForm() {
    document.getElementById("modal-maint-contact")?.classList.remove("is-open");
  }

  function openContactForm(id) {
    const item = find(id);
    if (!item) return;
    ensureModals();
    document.getElementById("maint-contact-id").value = item.id;
    document.getElementById("maint-contact-date").value = window.labelDate ? window.labelDate(todayIso()) : todayIso();
    document.getElementById("maint-contact-result").value = "vai_retornar";
    document.getElementById("maint-contact-informed").value = "";
    document.getElementById("maint-contact-next").value = "";
    document.getElementById("maint-contact-note").value = "";
    const hint = document.getElementById("maint-contact-hint");
    if (hint) {
      hint.textContent = `${clientName(item.clienteId) || "Cliente"} · ${item.servicoManutencaoNome || item.servicoOriginalNome} · prevista ${showDate(item.dataPrevista)}. A data original não muda.`;
    }
    document.getElementById("modal-maint-contact").classList.add("is-open");
    if (window.enhanceDateField) {
      window.enhanceDateField(document.getElementById("maint-contact-date"));
      window.enhanceDateField(document.getElementById("maint-contact-informed"));
      window.enhanceDateField(document.getElementById("maint-contact-next"));
    }
  }

  function askWhich(appt, candidates) {
    ensureModals();
    pendingChoice = { appt, candidates };
    const box = document.getElementById("maint-pick-list");
    box.innerHTML = candidates
      .map((item) => {
        const name = clientName(item.clienteId);
        return `
          <button class="btn btn--secondary maint-pick-btn" type="button" data-maint-pick="${item.id}">
            ${item.servicoManutencaoNome || item.servicoOriginalNome}<br>
            <span class="hint">${name} · prevista ${window.displayDate ? window.displayDate(item.dataPrevista) : item.dataPrevista} · ${STATUS_LABEL[item.status]}</span>
          </button>
        `;
      })
      .join("");
    document.getElementById("modal-maint-pick").classList.add("is-open");
  }

  function resolveChoice(id) {
    const modal = document.getElementById("modal-maint-pick");
    if (modal) modal.classList.remove("is-open");
    const job = pendingChoice;
    pendingChoice = null;
    if (!job) return;
    const doneList = [];
    if (id) {
      const done = fulfill(id, job.appt);
      if (done) doneList.push(done);
    }
    generateFromAppointment(job.appt, doneList);
  }

  function syncAll() {
    if (!window.StudioState) return;
    window.StudioState.list().forEach((appt) => processAppointment(appt, lastStatus[appt.id]));
    captureStatus();
  }

  function onAppointmentsChanged() {
    if (!bootstrapped) return;
    if (!window.StudioState) return;
    window.StudioState.list().forEach((appt) => {
      const prev = lastStatus[appt.id];
      if (prev === appt.status && appt.status !== "concluido") {
        if ((appt.status === "agendado" || appt.status === "confirmado") && appt.manutencaoId) {
          markAgendada(appt.manutencaoId, appt.id);
        }
        return;
      }
      processAppointment(appt, prev);
    });
    Object.keys(lastStatus).forEach((id) => {
      if (!window.StudioState.appointment(id)) reopenIfCancelled(id);
    });
    captureStatus();
  }

  function lastContact(item) {
    const list = (item && item.contatos) || [];
    return list.length ? list[list.length - 1] : null;
  }

  function lastInformedDate(item) {
    const list = (item && item.contatos) || [];
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i].dataInformadaCliente) return list[i].dataInformadaCliente;
    }
    return "";
  }

  function showDate(iso) {
    if (!iso) return "—";
    return window.displayDate ? window.displayDate(iso) : iso;
  }

  function situationOf(item) {
    const today = todayIso();
    const overdue = item.status === "pendente" && item.dataPrevista && item.dataPrevista < today;
    const follow = item.acompanhamentoStatus || "sem_contato";
    const last = lastContact(item);
    const informed = lastInformedDate(item);
    const nextAction = last ? last.proximaAcao : "";
    let tone = "soon";
    if (follow === "encerrado") tone = "done";
    else if (follow === "aguardando_retorno") tone = "wait";
    else if (overdue) tone = "overdue";
    return {
      overdue,
      follow,
      tone,
      timingLabel: overdue ? "Vencido" : "Próximo",
      followLabel: FOLLOW_LABEL[follow] || FOLLOW_LABEL.sem_contato,
      informed,
      nextAction,
      last
    };
  }

  function situationKey(item) {
    if (!item) return "";
    if (item.status === "agendada") return "agendado";
    if (item.acompanhamentoStatus === "encerrado") return "encerrado";
    if (item.acompanhamentoStatus === "aguardando_retorno") return "aguardando";
    const today = todayIso();
    if (item.status === "pendente" && item.dataPrevista && item.dataPrevista < today) return "vencido";
    const near = item.dataPrevista && item.dataPrevista >= today && item.dataPrevista <= addDays(today, JANELA_DIAS);
    if (item.status === "pendente" && near) return "proximo";
    if (item.acompanhamentoStatus === "sem_contato") return "sem_contato";
    return "proximo";
  }

  function situationLabel(item) {
    const key = situationKey(item);
    if (key === "agendado") {
      const detail = cycleDetail(item);
      return detail.booked ? "Agendado — " + detail.booked : "Agendado";
    }
    const map = {
      vencido: "Vencido",
      proximo: "Próximo",
      sem_contato: "Sem contato",
      aguardando: "Aguardando retorno",
      encerrado: "Encerrado"
    };
    return map[key] || sitFallback(item);
  }

  function sitFallback(item) {
    const sit = situationOf(item);
    return sit.timingLabel + " · " + sit.followLabel;
  }

  function originAppointment(item) {
    if (!item || !item.agendamentoOrigemId || !window.StudioState) return null;
    return window.StudioState.appointment(item.agendamentoOrigemId) || null;
  }

  function originCompleted(item) {
    const appt = originAppointment(item);
    if (appt) return appt.status === "concluido" ? appt : null;
    if (item && item.dataAtendimentoOrigem) {
      return {
        id: "",
        date: item.dataAtendimentoOrigem,
        time: "",
        status: "concluido",
        servicos: [{ nome: item.servicoOriginalNome || item.servicoNome, profissional: item.profissional }],
        professional: item.profissional,
        valorTotal: 0,
        formaPagamento: ""
      };
    }
    return null;
  }

  function paymentLabel(value) {
    if (value === "cartao") return "Cartão";
    if (value === "dinheiro") return "Dinheiro";
    if (value === "pix") return "Pix";
    return value || "—";
  }

  function situationPill(item) {
    const sit = situationOf(item);
    const tone = sit.tone === "overdue" ? "overdue" : sit.tone === "wait" ? "wait" : sit.tone === "done" ? "done" : "soon";
    return `<span class="crm-pill is-${tone}">${esc(situationLabel(item))}</span>`;
  }

  function nextActionCopy(item) {
    const last = (item.contatos || [])[item.contatos.length - 1];
    if (!last) return { text: "Registrar contato", sort: "" };
    const result = RESULT_LABEL[last.resultado] || last.resultado || "";
    const when = last.proximaAcao ? showDate(last.proximaAcao) : "";
    return {
      text: when ? `${result} · ${when}` : result,
      sort: last.proximaAcao || last.data || ""
    };
  }

  function isRelevantReturn(item, range) {
    if (!item || item.status === "concluida") return false;
    if (item.status !== "pendente" && item.status !== "agendada") return false;
    if (item.acompanhamentoStatus === "encerrado") return false;
    const today = todayIso();
    const prevista = item.dataPrevista || "";
    const overdue = item.status === "pendente" && prevista && prevista < today;
    const periodTouchesPast = range && range.start && range.start <= today;
    if (overdue && periodTouchesPast) return true;
    if (!range || !range.start || !range.end) return Boolean(prevista);
    return prevista >= range.start && prevista <= range.end;
  }

  function uniqueClientCount(list) {
    return new Set((list || []).map((item) => String(item.clienteId || "")).filter(Boolean)).size;
  }

  function dashboardStats(range) {
    const today = todayIso();
    const bounds = range || { start: today, end: today };
    const relevant = items.filter((item) => isRelevantReturn(item, bounds));
    const vencidas = relevant.filter(
      (item) => item.status === "pendente" && item.dataPrevista && item.dataPrevista < today
    );
    const proximos = relevant.filter(
      (item) =>
        item.status === "pendente" &&
        item.dataPrevista &&
        item.dataPrevista >= today &&
        item.dataPrevista >= bounds.start &&
        item.dataPrevista <= bounds.end
    );
    const semContato = relevant.filter(
      (item) => item.status === "pendente" && item.acompanhamentoStatus === "sem_contato"
    );
    const aguardando = relevant.filter(
      (item) => item.status === "pendente" && item.acompanhamentoStatus === "aguardando_retorno"
    );
    return {
      vencidas: uniqueClientCount(vencidas),
      proximos: uniqueClientCount(proximos),
      semContato: uniqueClientCount(semContato),
      aguardando: uniqueClientCount(aguardando)
    };
  }

  function isActiveReturn(item) {
    if (!item || item.status !== "pendente") return false;
    if (item.acompanhamentoStatus === "encerrado") return false;
    const today = todayIso();
    const prevista = item.dataPrevista || "";
    const overdue = prevista && prevista < today;
    const near = prevista && prevista >= today && prevista <= addDays(today, JANELA_DIAS);
    const waiting = item.acompanhamentoStatus === "aguardando_retorno";
    return Boolean(overdue || near || waiting);
  }

  function activeReturns() {
    return items
      .filter(isActiveReturn)
      .sort((a, b) => {
        const sa = situationOf(a);
        const sb = situationOf(b);
        const rank = (sit) => (sit.tone === "overdue" ? 0 : sit.tone === "wait" ? 1 : 2);
        return rank(sa) - rank(sb) || String(a.dataPrevista).localeCompare(String(b.dataPrevista));
      })
      .map(enriched);
  }

  function nextContactId(list) {
    let max = 0;
    (list || []).forEach((item) => {
      const match = String(item.id || "").match(/^CT(\d+)$/i);
      if (match) max = Math.max(max, Number(match[1]));
    });
    return "CT" + String(max + 1).padStart(3, "0");
  }

  function toIsoDate(value) {
    if (!value) return "";
    if (window.parseDate) return window.parseDate(value) || "";
    return String(value);
  }

  function addContact(id, fields) {
    const item = find(id);
    if (!item || item.status === "concluida") return null;
    const option = RESULT_OPTIONS.find((row) => row.id === fields.resultado) || RESULT_OPTIONS[0];
    const contact = normalizeContact({
      id: nextContactId(item.contatos),
      data: toIsoDate(fields.data) || todayIso(),
      resultado: option.id,
      observacao: String(fields.observacao || "").trim(),
      dataInformadaCliente: toIsoDate(fields.dataInformadaCliente),
      proximaAcao: toIsoDate(fields.proximaAcao)
    });
    item.contatos = (item.contatos || []).concat(contact);
    item.acompanhamentoStatus = option.follow;
    item.atualizadoEm = nowIso();
    persist();
    return clone(item);
  }

  function enriched(item) {
    const view = clone(item);
    const sit = situationOf(item);
    view.clienteNome = clientName(item.clienteId);
    view.statusLabel = STATUS_LABEL[item.status] || item.status;
    view.timingLabel = timingLabel(item);
    view.servicoNome = item.servicoManutencaoNome || item.servicoOriginalNome;
    view.followLabel = sit.followLabel;
    view.situationTiming = sit.timingLabel;
    view.situationTone = sit.tone;
    view.informedDate = sit.informed;
    view.nextActionDate = sit.nextAction;
    view.lastContact = sit.last;
    view.activeReturn = isActiveReturn(item);
    return view;
  }

  function listAll() {
    return items.map(enriched);
  }

  function byClient(clienteId) {
    return items
      .filter((item) => String(item.clienteId) === String(clienteId))
      .sort((a, b) => String(b.dataPrevista).localeCompare(String(a.dataPrevista)))
      .map(enriched);
  }

  function upcoming() {
    const limit = addDays(todayIso(), JANELA_DIAS);
    const today = todayIso();
    return items
      .filter(
        (item) =>
          isOfferCycle(item) &&
          item.dataPrevista >= today &&
          item.dataPrevista <= limit
      )
      .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))
      .map(enriched);
  }

  function overdue() {
    return items
      .filter(isOverdueCycle)
      .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))
      .map(enriched);
  }

  function nextForClient(clienteId) {
    return items
      .filter(
        (item) =>
          String(item.clienteId) === String(clienteId) &&
          (item.status === "pendente" || item.status === "agendada")
      )
      .sort((a, b) => String(a.dataPrevista).localeCompare(String(b.dataPrevista)))
      .map(enriched);
  }

  function historyForClient(clienteId) {
    return items
      .filter((item) => String(item.clienteId) === String(clienteId) && item.status === "concluida")
      .sort((a, b) =>
        String(b.realizadaEm || b.dataAtendimentoOrigem).localeCompare(
          String(a.realizadaEm || a.dataAtendimentoOrigem)
        )
      )
      .map(enriched);
  }

  function suggestedDate(item) {
    if (!item) return TODAY;
    return item.dataPrevista && item.dataPrevista < TODAY ? TODAY : item.dataPrevista || TODAY;
  }

  function clientHasUpcoming(clienteId) {
    return upcoming().some((item) => String(item.clienteId) === String(clienteId));
  }

  function clientHasOverdue(clienteId) {
    return overdue().some((item) => String(item.clienteId) === String(clienteId));
  }

  function isOfferCycle(item) {
    return (
      item.status === "pendente" &&
      item.acompanhamentoStatus !== "encerrado" &&
      item.dataPrevista &&
      item.dataPrevista >= todayIso()
    );
  }

  function isOverdueCycle(item) {
    return (
      item.status === "pendente" &&
      item.acompanhamentoStatus !== "encerrado" &&
      item.dataPrevista &&
      item.dataPrevista < todayIso()
    );
  }

  function offer() {
    return items
      .filter(isOfferCycle)
      .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))
      .map(enriched);
  }

  function scheduled() {
    return items
      .filter((item) => item.status === "agendada")
      .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))
      .map(enriched);
  }

  function clientHasOffer(clienteId) {
    return items.some((item) => String(item.clienteId) === String(clienteId) && isOfferCycle(item));
  }

  function clientHasScheduled(clienteId) {
    return items.some((item) => String(item.clienteId) === String(clienteId) && item.status === "agendada");
  }

  function returnKind(clienteId) {
    const rows = items.filter((item) => String(item.clienteId) === String(clienteId));
    if (rows.some(isOverdueCycle)) {
      const row = rows.filter(isOverdueCycle).sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))[0];
      return { id: "vencido", label: "Vencido", cycle: row ? enriched(row) : null };
    }
    if (rows.some(isOfferCycle)) {
      const row = rows.filter(isOfferCycle).sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))[0];
      return { id: "oferecer", label: "Precisa agendar", cycle: row ? enriched(row) : null };
    }
    if (rows.some((item) => item.status === "agendada")) {
      const row = rows
        .filter((item) => item.status === "agendada")
        .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))[0];
      return { id: "agendado", label: "Agendado", cycle: row ? enriched(row) : null };
    }
    return { id: "nenhum", label: "—", cycle: null };
  }

  function schedule(id) {
    const item = find(id);
    if (!item || item.status === "concluida") return;
    if (typeof window.openNewAppointment !== "function") return;
    if (item.status === "agendada" && item.agendamentoAgendadoId) {
      window.openNewAppointment({
        appointmentId: item.agendamentoAgendadoId,
        manutencaoId: item.id,
        origin: document.body.dataset.page
      });
      return;
    }
    window.openNewAppointment({
      clientId: item.clienteId,
      servicoId: item.servicoOriginalId || item.servicoManutencaoId,
      modalidade: "manutencao",
      profissional: item.profissional,
      manutencaoId: item.id,
      date: suggestedDate(item),
      origin: document.body.dataset.page
    });
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cardMarkup(item, options) {
    const opts = options || {};
    const when = window.displayDate ? window.displayDate(item.dataPrevista) : item.dataPrevista;
    const done = item.realizadaEm && window.displayDate ? window.displayDate(item.realizadaEm) : item.realizadaEm;
    const overdueDays =
      item.status === "pendente" && item.dataPrevista && item.dataPrevista < TODAY
        ? diffDays(item.dataPrevista, TODAY)
        : 0;
    const overdueHint =
      overdueDays > 0
        ? `<p class="hint">Vencida há ${overdueDays} ${overdueDays === 1 ? "dia" : "dias"}.</p>`
        : "";
    const scheduleBtn =
      item.status === "agendada"
        ? `<button class="btn btn--secondary" type="button" data-maint-schedule="${esc(item.id)}">Ver agendamento</button>`
        : item.status === "pendente"
          ? `<button class="btn btn--primary" type="button" data-maint-schedule="${esc(item.id)}">Agendar manutenção</button>`
          : "";
    return `
      <article class="card maint-card">
        <div>
          <p class="kicker">Manutenção nº ${item.numero}</p>
          <h3 class="svc-card-name">${esc(opts.showClient ? item.clienteNome : item.servicoNome)}</h3>
          ${opts.showClient ? `<p class="svc-card-meta">${esc(item.servicoNome)}</p>` : ""}
          <p class="hint">Prevista: ${esc(when)}${done ? ` · Realizada: ${esc(done)}` : ""}</p>
          ${overdueHint}
          <p class="hint">${esc(item.profissional || "")}</p>
          <span class="badge badge--${item.status === "concluida" ? "concluido" : item.status === "agendada" ? "confirmado" : "agendado"}">${esc(item.timingLabel)}</span>
        </div>
        ${opts.actions === false ? "" : `<div class="btn-row">${scheduleBtn}</div>`}
      </article>
    `;
  }

  function contactHistoryMarkup(item) {
    const list = item.contatos || [];
    if (!list.length) {
      return `<p class="hint">Nenhum contato registrado.</p>`;
    }
    return `
      <ul class="return-history">
        ${list
          .map((row) => {
            const informed = row.dataInformadaCliente ? ` · informou ${showDate(row.dataInformadaCliente)}` : "";
            const next = row.proximaAcao ? ` · próxima ação ${showDate(row.proximaAcao)}` : "";
            const note = row.observacao ? `<span class="hint">${esc(row.observacao)}</span>` : "";
            return `<li><strong>${esc(showDate(row.data))}</strong> · ${esc(RESULT_LABEL[row.resultado] || row.resultado)}${informed}${next}${note}</li>`;
          })
          .join("")}
      </ul>
    `;
  }

  function followButtons(item) {
    const history = `<button class="btn btn--secondary" type="button" data-return-history="${esc(item.id)}">Histórico</button>`;
    if (item.status === "agendada") {
      return `${history}<button class="btn btn--secondary" type="button" data-maint-schedule="${esc(item.id)}">Ver agendamento</button>`;
    }
    if (item.status !== "pendente") return history;
    return `
      ${history}
      <button class="btn btn--secondary" type="button" data-maint-contact="${esc(item.id)}"><span class="btn-label-long">Registrar contato</span><span class="btn-label-short">Contato</span></button>
      <button class="btn btn--primary" type="button" data-maint-schedule="${esc(item.id)}">Agendar</button>
    `;
  }

  function returnRowMarkup(item, options) {
    const opts = options || {};
    const sit = situationOf(item);
    const when = showDate(item.dataPrevista);
    const origin = originCompleted(item);
    const originLabel = origin ? showDate(origin.date) : "—";
    const last = (item.contatos || [])[item.contatos.length - 1];
    const lastContact = last ? showDate(last.data) : "—";
    const next = nextActionCopy(item);
    const name = item.clienteNome || clientName(item.clienteId);
    const compact = opts.compact !== false;
    return `
      <tr class="agenda-row return-record tone-${esc(sit.tone)}">
        <td class="return-cell-date" data-label="Retorno">${esc(when)}</td>
        <td class="return-cell-client" data-label="Cliente"><a class="appt-name" href="clientes.html?cliente=${encodeURIComponent(item.clienteId)}#cliente=${encodeURIComponent(item.clienteId)}">${esc(name)}</a></td>
        <td class="return-cell-svc" data-label="Serviço">${esc(item.servicoNome || item.servicoManutencaoNome || item.servicoOriginalNome)}</td>
        <td class="return-cell-pro" data-label="Profissional">${esc(item.profissional || "—")}</td>
        <td class="return-cell-ultimo" data-label="Último atendimento">${esc(originLabel)}</td>
        <td class="return-cell-sit" data-label="Situação">${situationPill(item)}</td>
        <td class="return-cell-contato" data-label="Último contato">${esc(lastContact)}</td>
        <td class="return-cell-acao" data-label="Próxima ação">${esc(next.text)}</td>
        ${compact ? `<td class="return-actions" data-label="Ações"><div class="btn-row">${followButtons(item)}</div></td>` : ""}
      </tr>
    `;
  }

  let returnSort = null;

  function returnSortGetters() {
    return {
      retorno: { type: "date", value: (item) => item.dataPrevista || "" },
      cliente: { type: "text", value: (item) => item.clienteNome || clientName(item.clienteId) || "" },
      servico: {
        type: "text",
        value: (item) => item.servicoNome || item.servicoManutencaoNome || item.servicoOriginalNome || ""
      },
      profissional: { type: "text", value: (item) => item.profissional || "" },
      ultimo: { type: "date", value: (item) => originCompletedIso(item) },
      situacao: {
        type: "status",
        value: (item) => situationKey(item),
        rank: { vencido: 0, proximo: 1, sem_contato: 2, aguardando: 3, agendado: 4, encerrado: 5 }
      },
      contato: {
        type: "date",
        value: (item) => {
          const last = (item.contatos || [])[item.contatos.length - 1];
          return last ? last.data : "";
        }
      },
      acao: { type: "date", value: (item) => nextActionCopy(item).sort }
    };
  }

  function originCompletedIso(item) {
    const appt = originCompleted(item);
    return appt ? appt.date : "";
  }

  function returnsTable(rows, options) {
    if (!rows.length) return "";
    const tables = window.StudioTables;
    const th = (label, key) => (tables ? tables.header(label, key, returnSort) : `<th>${label}</th>`);
    return `
      <div class="agenda-table-wrap crm-table-wrap return-table-wrap">
        <table class="agenda-table return-table">
          <thead>
            <tr>
              ${th("Retorno", "retorno")}
              ${th("Cliente", "cliente")}
              ${th("Serviço", "servico")}
              ${th("Profissional", "profissional")}
              ${th("Último atendimento", "ultimo")}
              ${th("Situação", "situacao")}
              ${th("Último contato", "contato")}
              ${th("Próxima ação", "acao")}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((item) => returnRowMarkup(item, options)).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDashboard() {
    const cards = document.getElementById("dash-return-cards");
    if (cards) {
      renderReturnsPage();
      return;
    }
    const host = document.getElementById("maint-returns") || document.getElementById("maint-upcoming");
    const legacyOver = document.getElementById("maint-overdue");
    if (legacyOver && document.getElementById("maint-returns")) legacyOver.innerHTML = "";
    if (!host) {
      renderReturnsPage();
      return;
    }
    const rows = activeReturns().slice(0, 5);
    host.innerHTML = rows.length
      ? returnsTable(rows)
      : `<p class="empty">Nenhuma cliente precisa de acompanhamento agora.</p>`;
    renderReturnsPage();
  }

  function applyReturnQuery() {
    if (!document.getElementById("returns-list")) return;
    const params = new URLSearchParams(window.location.search || "");
    const hash = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
    let nav = null;
    try {
      const raw = sessionStorage.getItem("studioElegancy_returnNav");
      nav = raw ? JSON.parse(raw) : null;
      if (raw) sessionStorage.removeItem("studioElegancy_returnNav");
    } catch (error) {
      nav = null;
    }
    const view = params.get("view") || hash.get("view") || (nav && nav.view) || "";
    const from = params.get("from") || hash.get("from") || (nav && nav.from) || "";
    const to = params.get("to") || hash.get("to") || (nav && nav.to) || "";
    if (view) {
      document.querySelectorAll("[data-return-filter]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.returnFilter === view);
      });
    }
    const fromEl = document.getElementById("ret-filter-from");
    const toEl = document.getElementById("ret-filter-to");
    if (fromEl && from) fromEl.value = from;
    if (toEl && to) toEl.value = to;
  }

  function fillReturnFilterOptions(rows) {
    const clientSel = document.getElementById("ret-filter-client");
    const svcSel = document.getElementById("ret-filter-svc");
    if (clientSel && !clientSel.dataset.ready) {
      const names = {};
      rows.forEach((item) => {
        const id = item.clienteId;
        if (!id || names[id]) return;
        names[id] = item.clienteNome || clientName(id) || id;
      });
      const current = clientSel.value;
      clientSel.innerHTML =
        `<option value="">Todas</option>` +
        Object.keys(names)
          .sort((a, b) => names[a].localeCompare(names[b], "pt-BR"))
          .map((id) => `<option value="${esc(id)}">${esc(names[id])}</option>`)
          .join("");
      clientSel.value = current || "";
      clientSel.dataset.ready = "1";
    }
    if (svcSel && !svcSel.dataset.ready) {
      const services = {};
      rows.forEach((item) => {
        const id = item.servicoOriginalId || item.servicoManutencaoId;
        const nome = item.servicoOriginalNome || item.servicoManutencaoNome || item.servicoNome;
        if (!id || services[id]) return;
        services[id] = nome || id;
      });
      const current = svcSel.value;
      svcSel.innerHTML =
        `<option value="">Todos</option>` +
        Object.keys(services)
          .sort((a, b) => services[a].localeCompare(services[b], "pt-BR"))
          .map((id) => `<option value="${esc(id)}">${esc(services[id])}</option>`)
          .join("");
      svcSel.value = current || "";
      svcSel.dataset.ready = "1";
    }
  }

  function bindReturnFilters() {
    if (bindReturnFilters.ready) return;
    const extras = document.getElementById("returns-extra-filters");
    if (!extras) return;
    bindReturnFilters.ready = true;
    extras.addEventListener("change", () => renderReturnsPage());
    document.getElementById("ret-filter-clear")?.addEventListener("click", () => {
      const clientSel = document.getElementById("ret-filter-client");
      const proSel = document.getElementById("ret-filter-pro");
      const svcSel = document.getElementById("ret-filter-svc");
      const sitSel = document.getElementById("ret-filter-sit");
      const fromEl = document.getElementById("ret-filter-from");
      const toEl = document.getElementById("ret-filter-to");
      if (clientSel) clientSel.value = "";
      if (proSel) proSel.value = "";
      if (svcSel) svcSel.value = "";
      if (sitSel) sitSel.value = "";
      if (fromEl) fromEl.value = "";
      if (toEl) toEl.value = "";
      document.querySelectorAll("[data-return-filter]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.returnFilter === "todas");
      });
      renderReturnsPage();
    });
    if (window.StudioTables) {
      window.StudioTables.bind(document.getElementById("returns-list"), (key) => {
        returnSort = window.StudioTables.nextState(returnSort, key);
        renderReturnsPage();
      });
    }
  }

  function renderReturnsPage() {
    const host = document.getElementById("returns-list");
    const count = document.getElementById("returns-count");
    if (!host) return;
    bindReturnFilters();
    const allRows = items
      .filter((item) => item.status === "pendente" || item.status === "agendada")
      .map(enriched);
    fillReturnFilterOptions(allRows);
    const filter = document.querySelector("[data-return-filter].is-active")?.dataset.returnFilter || "todas";
    const clientId = document.getElementById("ret-filter-client")?.value || "";
    const pro = document.getElementById("ret-filter-pro")?.value || "";
    const svcId = document.getElementById("ret-filter-svc")?.value || "";
    const sit = document.getElementById("ret-filter-sit")?.value || "";
    const from = document.getElementById("ret-filter-from")?.value || "";
    const to = document.getElementById("ret-filter-to")?.value || "";
    const range = from && to ? { start: from, end: to } : null;
    let rows = allRows.slice();
    if (filter === "vencida") {
      rows = rows.filter((item) => situationOf(item).overdue);
      if (range) rows = rows.filter((item) => isRelevantReturn(item, range));
    } else if (filter === "proxima") {
      rows = rows.filter((item) => item.status === "pendente" && !situationOf(item).overdue && item.acompanhamentoStatus !== "encerrado");
      if (range) {
        rows = rows.filter((item) => item.dataPrevista >= range.start && item.dataPrevista <= range.end);
      } else {
        rows = rows.filter((item) => {
          const prevista = item.dataPrevista || "";
          const today = todayIso();
          return prevista >= today && prevista <= addDays(today, JANELA_DIAS);
        });
      }
    } else if (filter === "sem_contato") {
      rows = rows.filter((item) => item.status === "pendente" && item.acompanhamentoStatus === "sem_contato");
    } else if (filter === "aguardando") {
      rows = rows.filter((item) => item.status === "pendente" && item.acompanhamentoStatus === "aguardando_retorno");
    }
    if (filter !== "vencida" && range && (filter === "todas" || filter === "sem_contato" || filter === "aguardando")) {
      rows = rows.filter((item) => isRelevantReturn(item, range));
    }
    if (clientId) rows = rows.filter((item) => String(item.clienteId) === clientId);
    if (pro) rows = rows.filter((item) => item.profissional === pro);
    if (svcId) {
      rows = rows.filter(
        (item) => item.servicoOriginalId === svcId || item.servicoManutencaoId === svcId
      );
    }
    if (sit) rows = rows.filter((item) => situationKey(item) === sit);
    if (window.StudioTables) rows = window.StudioTables.sortRows(rows, returnSort, returnSortGetters());
    if (count) {
      count.textContent = rows.length === 1 ? "1 retorno encontrado" : `${rows.length} retornos encontrados`;
    }
    const extrasOn = Boolean(clientId || pro || svcId || sit || from || to || filter !== "todas");
    host.innerHTML = rows.length
      ? returnsTable(rows)
      : `<p class="empty">Nenhum retorno encontrado.${extrasOn ? " Limpe os filtros para ver todos os registros." : ""}</p>`;
  }

  function cycleDetail(item) {
    const prev = window.displayDate ? window.displayDate(item.dataPrevista) : item.dataPrevista;
    const done = item.realizadaEm && window.displayDate ? window.displayDate(item.realizadaEm) : item.realizadaEm;
    const appt =
      item.agendamentoAgendadoId && window.StudioState
        ? window.StudioState.appointment(item.agendamentoAgendadoId)
        : null;
    const booked =
      appt && (appt.status === "agendado" || appt.status === "confirmado")
        ? `${window.displayDate ? window.displayDate(appt.date) : appt.date} · ${appt.time || "—"}`
        : "";
    return { prev, done, booked, appt };
  }

  function cycleCard(item, kind) {
    const detail = cycleDetail(item);
    const sit = situationOf(item);
    let extra = "";
    if (kind === "agendado") {
      extra = detail.booked
        ? `<p class="hint">Agendado para ${esc(detail.booked)}</p>`
        : `<p class="hint">Retorno agendado.</p>`;
    } else if (kind === "concluido") {
      extra = detail.done ? `<p class="hint">Realizada em ${esc(detail.done)}</p>` : "";
    } else if (sit.overdue) {
      extra = `<p class="hint">Vencida desde ${esc(detail.prev)}. A data prevista original permanece.</p>`;
    } else {
      extra = `<p class="hint">Ainda não há agendamento ligado a este ciclo.</p>`;
    }
    const informed = sit.informed
      ? `<p class="hint">Cliente informou retorno em ${esc(showDate(sit.informed))}.</p>`
      : "";
    return `
      <article class="card maint-card">
        <div>
          <p class="kicker">${esc(item.servicoNome || item.servicoOriginalNome)}</p>
          <h3 class="svc-card-name">${esc(item.servicoOriginalNome || item.servicoNome)}</h3>
          <p class="hint">Previsão original: ${esc(detail.prev)}</p>
          ${extra}
          ${informed}
          ${item.profissional ? `<p class="hint">${esc(item.profissional)}</p>` : ""}
          <span class="badge badge--${item.status === "concluida" ? "concluido" : item.status === "agendada" ? "confirmado" : "agendado"}">${esc(item.timingLabel)}</span>
          ${item.status === "pendente" ? `<span class="badge badge--agendado">${esc(sit.timingLabel)} · ${esc(sit.followLabel)}</span>` : ""}
          <div class="return-follow">
            <p class="kicker">Acompanhamento</p>
            ${contactHistoryMarkup(item)}
          </div>
        </div>
        <div class="btn-row">${followButtons(item)}</div>
      </article>
    `;
  }

  function renderClientSection(clienteId) {
    const rows = byClient(clienteId);
    const openRows = rows.filter((item) => item.status === "pendente");
    const bookedRows = rows.filter((item) => item.status === "agendada");
    const doneRows = rows.filter((item) => item.status === "concluida");
    const closedFollow = openRows.filter((item) => item.acompanhamentoStatus === "encerrado");
    const activeFollow = openRows.filter((item) => item.acompanhamentoStatus !== "encerrado");
    const block = (title, items, kind, empty) => `
      <h4 class="kicker" style="margin-top:16px">${title}</h4>
      ${items.length ? items.map((item) => cycleCard(item, kind)).join("") : `<p class="empty">${empty}</p>`}
    `;
    if (!rows.length) {
      return `<section class="maint-profile"><p class="empty">Nenhuma manutenção prevista para esta cliente.</p></section>`;
    }
    return `
      <section class="maint-profile">
        ${block("Acompanhar retorno", activeFollow, "aberto", "Nenhum retorno pendente de acompanhamento.")}
        ${block("Retorno agendado", bookedRows, "agendado", "Nenhum retorno agendado.")}
        ${block("Acompanhamento encerrado", closedFollow, "encerrado", "Nenhum acompanhamento encerrado.")}
        ${block("Retorno concluído", doneRows, "concluido", "Nenhum ciclo concluído ainda.")}
      </section>
    `;
  }

  document.addEventListener("click", (event) => {
    const contactBtn = event.target.closest("[data-maint-contact]");
    if (contactBtn) {
      event.preventDefault();
      event.stopPropagation();
      openContactForm(contactBtn.dataset.maintContact);
      return;
    }
    const historyBtn = event.target.closest("[data-return-history]");
    if (historyBtn) {
      event.preventDefault();
      event.stopPropagation();
      openReturnHistory(historyBtn.dataset.returnHistory);
      return;
    }
    const filterBtn = event.target.closest("[data-return-filter]");
    if (filterBtn) {
      document.querySelectorAll("[data-return-filter]").forEach((btn) => {
        btn.classList.toggle("is-active", btn === filterBtn);
      });
      renderReturnsPage();
      return;
    }
    const btn = event.target.closest("[data-maint-schedule]");
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    schedule(btn.dataset.maintSchedule);
  });

  document.addEventListener("appointments:changed", onAppointmentsChanged);
  document.addEventListener("manutencoes:changed", () => {
    renderDashboard();
  });

  window.StudioMaintenance = {
    TODAY,
    JANELA_DIAS,
    list: listAll,
    byClient,
    upcoming,
    overdue,
    offer,
    scheduled,
    nextForClient,
    historyForClient,
    activeReturns,
    dashboardStats,
    isRelevantReturn,
    addContact,
    openContactForm,
    schedule,
    timingLabel,
    cardMarkup,
    returnRowMarkup,
    renderDashboard,
    renderReturnsPage,
    renderClientSection,
    addPrazo,
    returnKind,
    clientHasUpcoming,
    clientHasOverdue,
    clientHasOffer,
    clientHasScheduled
  };

  captureStatus();
  syncAll();
  bootstrapped = true;
  applyReturnQuery();
  renderDashboard();
})();
