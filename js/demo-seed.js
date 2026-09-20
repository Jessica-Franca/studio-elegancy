(function () {
  const data = window.StudioData;
  if (!data || data._demoSeedApplied) return;
  data._demoSeedApplied = true;

  function todayIso() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(iso, amount) {
    const parts = String(iso).split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + amount);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const extraClients = [
    { id: "mariana", name: "Mariana Souza", phone: "(11) 91001-1001", whatsapp: "(11) 91001-1001", email: "mariana.souza.demo@email.com", birth: "1993-04-12", notes: "Prefere unhas naturais." },
    { id: "camila", name: "Camila Oliveira", phone: "(11) 91002-1002", whatsapp: "(11) 91002-1002", email: "camila.oliveira.demo@email.com", birth: "1991-08-03", notes: "Gosta de francesinha." },
    { id: "beatriz", name: "Beatriz Costa", phone: "(11) 91003-1003", whatsapp: "(11) 91003-1003", birth: "1989-12-21" },
    { id: "larissa", name: "Larissa Almeida", phone: "(11) 91004-1004", whatsapp: "(11) 91004-1004", email: "larissa.almeida.demo@email.com", birth: "1997-02-18", notes: "Atendimento pela manhã." },
    { id: "amandar", name: "Amanda Ribeiro", phone: "(11) 91005-1005", whatsapp: "(11) 91005-1005", birth: "1995-06-09" },
    { id: "carolina", name: "Carolina Ferreira", phone: "(11) 91006-1006", whatsapp: "(11) 91006-1006", email: "carolina.ferreira.demo@email.com", birth: "1990-01-27" },
    { id: "renata", name: "Renata Gomes", phone: "(11) 91007-1007", whatsapp: "(11) 91007-1007", birth: "1987-09-14", notes: "Prefere cílios volume brasileiro." },
    { id: "vanessa", name: "Vanessa Rodrigues", phone: "(11) 91008-1008", whatsapp: "(11) 91008-1008", email: "vanessa.rodrigues.demo@email.com", birth: "1994-11-30" },
    { id: "brunam", name: "Bruna Martins", phone: "(11) 91009-1009", whatsapp: "(11) 91009-1009", birth: "1992-05-06" },
    { id: "gabriela", name: "Gabriela Alves", phone: "(11) 91010-1010", whatsapp: "(11) 91010-1010", email: "gabriela.alves.demo@email.com", birth: "1998-07-19" },
    { id: "leticia", name: "Letícia Carvalho", phone: "(11) 91011-1011", whatsapp: "(11) 91011-1011", birth: "1996-03-02", notes: "Cliente nova no Studio." },
    { id: "isabela", name: "Isabela Mendes", phone: "(11) 91012-1012", whatsapp: "(11) 91012-1012", email: "isabela.mendes.demo@email.com", birth: "1993-10-25" },
    { id: "tatiane", name: "Tatiane Nogueira", phone: "(11) 91013-1013", whatsapp: "(11) 91013-1013", birth: "1986-08-11" },
    { id: "helena", name: "Helena Duarte", phone: "(11) 91014-1014", whatsapp: "(11) 91014-1014", email: "helena.duarte.demo@email.com", birth: "1991-12-08" },
    { id: "raquel", name: "Raquel Barbosa", phone: "(11) 91015-1015", whatsapp: "(11) 91015-1015", birth: "1995-04-16" },
    { id: "sofia", name: "Sofia Teixeira", phone: "(11) 91016-1016", whatsapp: "(11) 91016-1016", email: "sofia.teixeira.demo@email.com", birth: "1999-01-22" }
  ];

  extraClients.forEach((row) => {
    if ((data.clients || []).some((item) => item.id === row.id)) return;
    data.clients.push({
      ...row,
      initials: row.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      since: "Cliente desde setembro de 2026",
      allergies: row.allergies || "",
      notes: row.notes || ""
    });
  });

  function line(servicoId, nome, categoria, valor, profissional) {
    return { servicoId, nome, categoria, valorReferencia: valor, profissional };
  }

  const today = todayIso();
  const extraAppointments = [
    { id: "pub-h01", clientId: "mariana", client: "Mariana Souza", date: addDays(today, -18), time: "10:00", status: "concluido", servicos: [line("mao", "Mão", "Unhas", 35, "Bruna")] },
    { id: "pub-h02", clientId: "camila", client: "Camila Oliveira", date: addDays(today, -16), time: "11:00", status: "concluido", servicos: [line("fio-a-fio", "Fio a fio", "Cílios", 120, "Amanda")] },
    { id: "pub-h03", clientId: "beatriz", client: "Beatriz Costa", date: addDays(today, -14), time: "14:00", status: "concluido", servicos: [line("soft-gel", "Soft gel", "Unhas", 120, "Bruna")] },
    { id: "pub-h04", clientId: "larissa", client: "Larissa Almeida", date: addDays(today, -12), time: "09:30", status: "concluido", servicos: [line("volume-brasileiro", "Volume brasileiro", "Cílios", 150, "Amanda")] },
    { id: "pub-h05", clientId: "carolina", client: "Carolina Ferreira", date: addDays(today, -10), time: "15:00", status: "concluido", servicos: [line("design", "Design", "Sobrancelhas", 40, "Bruna")] },
    { id: "pub-h06", clientId: "renata", client: "Renata Gomes", date: addDays(today, -9), time: "10:30", status: "concluido", servicos: [line("volume-hibrido", "Volume híbrido", "Cílios", 150, "Amanda")] },
    { id: "pub-h07", clientId: "gabriela", client: "Gabriela Alves", date: addDays(today, -7), time: "13:30", status: "concluido", servicos: [line("molde-f1", "Molde F1", "Unhas", 150, "Bruna")] },
    { id: "pub-h08", clientId: "isabela", client: "Isabela Mendes", date: addDays(today, -5), time: "16:00", status: "concluido", servicos: [line("lash-lifting", "Lash lifting", "Cílios", 100, "Amanda")] },
    { id: "pub-h09", clientId: "helena", client: "Helena Duarte", date: addDays(today, -3), time: "11:30", status: "concluido", servicos: [line("banho-de-gel", "Banho de gel", "Unhas", 80, "Bruna")] },
    { id: "pub-c01", clientId: "vanessa", client: "Vanessa Rodrigues", date: addDays(today, -4), time: "09:00", status: "cancelado", servicos: [line("henna", "Henna", "Sobrancelhas", 60, "Bruna")] },
    { id: "pub-c02", clientId: "tatiane", client: "Tatiane Nogueira", date: addDays(today, -2), time: "14:30", status: "cancelado", servicos: [line("anime", "Anime", "Cílios", 170, "Amanda")] },
    { id: "pub-t01", clientId: "leticia", client: "Letícia Carvalho", date: today, time: "11:00", status: "confirmado", servicos: [line("mao-e-pe", "Mão e pé", "Unhas", 70, "Bruna")] },
    { id: "pub-t02", clientId: "sofia", client: "Sofia Teixeira", date: today, time: "14:00", status: "agendado", servicos: [line("alongamento-light", "Alongamento light", "Cílios", 100, "Amanda")] },
    { id: "pub-f01", clientId: "mariana", client: "Mariana Souza", date: addDays(today, 1), time: "10:00", status: "agendado", servicos: [line("mao", "Mão", "Unhas", 35, "Bruna")] },
    { id: "pub-f02", clientId: "camila", client: "Camila Oliveira", date: addDays(today, 1), time: "10:00", status: "confirmado", servicos: [line("volume-russo", "Volume russo", "Cílios", 180, "Amanda")] },
    { id: "pub-f03", clientId: "amandar", client: "Amanda Ribeiro", date: addDays(today, 2), time: "09:00", status: "agendado", servicos: [line("alongamento-gel-na-tip", "Alongamento gel na tip", "Unhas", 160, "Bruna")] },
    { id: "pub-f04", clientId: "brunam", client: "Bruna Martins", date: addDays(today, 2), time: "11:00", status: "agendado", servicos: [line("fio-a-fio", "Fio a fio", "Cílios", 120, "Amanda")] },
    { id: "pub-f05", clientId: "carolina", client: "Carolina Ferreira", date: addDays(today, 3), time: "15:00", status: "confirmado", servicos: [line("spa-dos-pes", "Spa dos pés", "Unhas", 80, "Bruna")] },
    { id: "pub-f06", clientId: "raquel", client: "Raquel Barbosa", date: addDays(today, 4), time: "09:30", status: "agendado", servicos: [line("brow-lamination", "Brow lamination", "Sobrancelhas", 120, "Amanda")] },
    { id: "pub-f07", clientId: "vanessa", client: "Vanessa Rodrigues", date: addDays(today, 5), time: "13:00", status: "agendado", servicos: [line("esmaltacao-gel-mao", "Esmaltação em gel — mão", "Unhas", 65, "Bruna")] },
    { id: "pub-f08", clientId: "gabriela", client: "Gabriela Alves", date: addDays(today, 6), time: "10:30", status: "confirmado", servicos: [line("volume-brasileiro", "Volume brasileiro", "Cílios", 150, "Amanda")] },
    { id: "pub-f09", clientId: "isabela", client: "Isabela Mendes", date: addDays(today, 8), time: "16:00", status: "agendado", servicos: [line("molde-f1", "Molde F1", "Unhas", 150, "Bruna")] },
    { id: "pub-f10", clientId: "helena", client: "Helena Duarte", date: addDays(today, 10), time: "09:00", status: "agendado", servicos: [line("lash-lifting", "Lash lifting", "Cílios", 100, "Amanda")] }
  ];

  extraAppointments.forEach((row) => {
    if ((data.appointments || []).some((item) => item.id === row.id)) return;
    data.appointments.push(row);
  });

  data.appointments = (data.appointments || []).map((row) => {
    if (!row || row.status === "cancelado" || row.status === "concluido") return row;
    if (row.date && row.date < today) return { ...row, status: "concluido" };
    return row;
  });
})();
