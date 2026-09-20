(function () {
  const MIGRATE_KEY = "studioElegancy_avail_v1";
  const SLOT_START = 8 * 60;
  const SLOT_END = 20 * 60;
  const SLOT_STEP = 15;
  const FALLBACK_DURATION = 60;
  const SEED_IDS = new Set((window.StudioData.appointments || []).map((item) => String(item.id)));

  function occupiesStatus(status) {
    return String(status || "") !== "cancelado";
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function minutesToTime(total) {
    const safe = Math.max(0, Math.round(Number(total) || 0));
    const hours = Math.floor(safe / 60) % 24;
    const minutes = safe % 60;
    return pad(hours) + ":" + pad(minutes);
  }

  function addDays(iso, amount) {
    const [year, month, day] = String(iso).split("-").map(Number);
    const date = new Date(year, month - 1, day + amount);
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate())
    );
  }

  function timeToMinutes(value) {
    const text = String(value || "").trim();
    const match = text.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  function catalogOf(ref) {
    if (!ref) return null;
    if (window.StudioState && typeof window.StudioState.service === "function") {
      const live = window.StudioState.service(ref);
      if (live) return live;
    }
    const data = window.StudioData;
    if (!data) return null;
    return data.serviceById(ref) || data.serviceByName(ref) || null;
  }

  function demoDurationOf(id, nome) {
    const data = window.StudioData;
    if (data && typeof data.demoDuration === "function") {
      const byId = data.demoDuration(id);
      if (id && data.demoDurations && data.demoDurations[id]) return byId;
      const found = data.serviceByName(nome);
      if (found) return data.demoDuration(found.id);
    }
    return FALLBACK_DURATION;
  }

  function parseDuration(value, fallback) {
    const n = Math.round(Number(value));
    if (Number.isFinite(n) && n > 0) return n;
    return fallback;
  }

  function getServiceDuration(ref) {
    if (ref && typeof ref === "object") {
      const fromLine = parseDuration(ref.duracaoMinutos, 0);
      if (fromLine) return fromLine;
      const catalog = catalogOf(ref.servicoId || ref.id || ref.nome || ref.name);
      if (catalog) return parseDuration(catalog.duracaoMinutos, demoDurationOf(catalog.id, catalog.nome));
      return demoDurationOf(ref.servicoId || ref.id, ref.nome || ref.name);
    }
    const catalog = catalogOf(ref);
    if (catalog) return parseDuration(catalog.duracaoMinutos, demoDurationOf(catalog.id, catalog.nome));
    return demoDurationOf(ref, ref);
  }

  function linesOf(appt) {
    if (appt && Array.isArray(appt.servicos) && appt.servicos.length) return appt.servicos;
    if (appt && (appt.service || appt.servico)) {
      return [
        {
          servicoId: "",
          nome: appt.service || appt.servico,
          profissional: appt.professional || appt.profissional || ""
        }
      ];
    }
    return [];
  }

  function getProfessionalOccupancy(appt) {
    const start = timeToMinutes(appt && (appt.time || appt.horario));
    const byPro = {};
    if (start == null) return [];
    linesOf(appt).forEach((line) => {
      const pro = String(line.profissional || line.professional || "").trim();
      if (!pro) return;
      byPro[pro] = (byPro[pro] || 0) + getServiceDuration(line);
    });
    return Object.keys(byPro).map((profissional) => ({
      profissional,
      start,
      end: start + byPro[profissional],
      duracaoMinutos: byPro[profissional]
    }));
  }

  function serviceTimeline(appt) {
    const start = timeToMinutes(appt && (appt.time || appt.horario));
    const cursor = {};
    return linesOf(appt).map((line) => {
      const pro = String(line.profissional || "").trim();
      const duracaoMinutos = getServiceDuration(line);
      const inicioMin = start == null ? null : cursor[pro] != null ? cursor[pro] : start;
      const fimMin = inicioMin == null ? null : inicioMin + duracaoMinutos;
      if (pro && inicioMin != null) cursor[pro] = fimMin;
      return {
        servicoId: line.servicoId,
        nome: line.nome,
        profissional: pro,
        duracaoMinutos,
        inicioMin,
        fimMin,
        inicio: inicioMin == null ? "" : minutesToTime(inicioMin),
        fim: fimMin == null ? "" : minutesToTime(fimMin)
      };
    });
  }

  function calculateAppointmentEnd(appt) {
    const blocks = getProfessionalOccupancy(appt);
    if (!blocks.length) {
      const start = timeToMinutes(appt && (appt.time || appt.horario));
      const total = linesOf(appt).reduce((sum, line) => sum + getServiceDuration(line), 0);
      if (start == null) return "";
      return minutesToTime(start + (total || FALLBACK_DURATION));
    }
    const end = Math.max.apply(null, blocks.map((item) => item.end));
    return minutesToTime(end);
  }

  function appointmentList() {
    if (window.StudioState && typeof window.StudioState.list === "function") {
      return window.StudioState.list();
    }
    return [];
  }

  function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && aEnd > bStart;
  }

  function conflictAgainst(candidate, existing, excludeId) {
    if (!existing || !occupiesStatus(existing.status)) return null;
    if (excludeId && String(existing.id) === String(excludeId)) return null;
    if (String(existing.date) !== String(candidate.date)) return null;
    const nextBlocks = getProfessionalOccupancy(candidate);
    const busyBlocks = getProfessionalOccupancy(existing);
    for (let i = 0; i < nextBlocks.length; i += 1) {
      const next = nextBlocks[i];
      for (let j = 0; j < busyBlocks.length; j += 1) {
        const busy = busyBlocks[j];
        if (next.profissional !== busy.profissional) continue;
        if (intervalsOverlap(next.start, next.end, busy.start, busy.end)) {
          return {
            appointmentId: existing.id,
            profissional: next.profissional,
            existingStart: minutesToTime(busy.start),
            existingEnd: minutesToTime(busy.end),
            newStart: minutesToTime(next.start),
            newEnd: minutesToTime(next.end)
          };
        }
      }
    }
    return null;
  }

  function hasAppointmentConflict(appt, excludeId) {
    if (!appt || !occupiesStatus(appt.status)) return null;
    if (timeToMinutes(appt.time || appt.horario) == null) {
      return { reason: "horario", message: "Informe um horário válido, por exemplo 14:30." };
    }
    const blocks = getProfessionalOccupancy(appt);
    if (!blocks.length) return null;
    const rows = appointmentList();
    for (let i = 0; i < rows.length; i += 1) {
      const hit = conflictAgainst(appt, rows[i], excludeId || appt.id);
      if (hit) {
        return {
          ...hit,
          message:
            hit.profissional +
            " já está ocupada das " +
            hit.existingStart +
            " às " +
            hit.existingEnd +
            "."
        };
      }
    }
    return null;
  }

  function getAvailableTimes(date, servicos, options) {
    const opts = options || {};
    const excludeId = opts.excludeId || "";
    const draft = {
      id: excludeId || "draft",
      date,
      time: "08:00",
      status: "agendado",
      servicos: servicos || []
    };
    const blocks = getProfessionalOccupancy({ ...draft, time: "08:00" });
    const duration = blocks.length ? Math.max.apply(null, blocks.map((item) => item.duracaoMinutos)) : 0;
    const latestStart = SLOT_END - (duration || SLOT_STEP);
    const times = [];
    for (let min = SLOT_START; min <= latestStart; min += SLOT_STEP) {
      draft.time = minutesToTime(min);
      if (!hasAppointmentConflict(draft, excludeId)) times.push(draft.time);
    }
    return times;
  }

  function auditScheduleConflicts(list) {
    const rows = (list || appointmentList())
      .filter((item) => occupiesStatus(item.status))
      .slice()
      .sort((a, b) => String(a.date + a.time + a.id).localeCompare(String(b.date + b.time + b.id)));
    const conflicts = [];
    rows.forEach((appt, index) => {
      for (let prev = 0; prev < index; prev += 1) {
        const hit = conflictAgainst(appt, rows[prev], appt.id);
        if (hit) {
          conflicts.push({
            appointmentId: appt.id,
            otherId: rows[prev].id,
            date: appt.date,
            profissional: hit.profissional,
            start: appt.time,
            end: minutesToTime(hit.newEnd ? timeToMinutes(hit.newEnd) : getProfessionalOccupancy(appt)[0] && getProfessionalOccupancy(appt)[0].end),
            otherStart: rows[prev].time,
            otherEnd: hit.existingEnd
          });
          break;
        }
      }
    });
    return {
      total: rows.length,
      conflicts,
      message:
        conflicts.length === 0
          ? "0 conflitos de agenda encontrados."
          : conflicts.length + " conflito(s) de agenda encontrados."
    };
  }

  function nextFreeSlot(appt, fromDate, fromMinutes) {
    const maxDays = 21;
    for (let day = 0; day < maxDays; day += 1) {
      const date = addDays(fromDate, day);
      const startMin = day === 0 ? fromMinutes : SLOT_START;
      const times = getAvailableTimes(date, appt.servicos, { excludeId: appt.id });
      const found = times.find((time) => timeToMinutes(time) >= startMin);
      if (found) return { date, time: found };
    }
    return null;
  }

  function migrateSeedAndRepair() {
    if (!window.StudioState || typeof window.StudioState.upsertAppointment !== "function") return null;
    let stored = null;
    try {
      stored = localStorage.getItem(MIGRATE_KEY);
    } catch (error) {
      stored = null;
    }
    if (stored) return JSON.parse(stored);

    const before = auditScheduleConflicts();
    const seed = window.StudioData.appointments || [];
    const moved = [];

    seed.forEach((raw) => {
      const current = window.StudioState.appointment(raw.id);
      if (current) {
        const sameIdentity =
          String(current.clientId) === String(raw.clientId) ||
          String(current.client) === String(raw.client);
        if (!sameIdentity) return;
        if (current.date !== raw.date || current.time !== raw.time) {
          moved.push({
            id: current.id,
            from: current.date + " " + current.time,
            to: raw.date + " " + raw.time,
            reason: "seed"
          });
        }
        window.StudioState.upsertAppointment(
          {
            ...current,
            date: raw.date,
            time: raw.time
          },
          { skipConflict: true }
        );
        return;
      }
      window.StudioState.upsertAppointment(raw, { skipConflict: true });
      moved.push({ id: raw.id, from: "", to: raw.date + " " + raw.time, reason: "seed-insert" });
    });

    const extrasMoved = [];
    let guard = 0;
    while (guard < 80) {
      guard += 1;
      const audit = auditScheduleConflicts();
      if (!audit.conflicts.length) break;
      const hit = audit.conflicts[0];
      const firstIsSeed = SEED_IDS.has(String(hit.appointmentId));
      const otherIsSeed = SEED_IDS.has(String(hit.otherId));
      const moveId = firstIsSeed && !otherIsSeed ? hit.otherId : hit.appointmentId;
      const live = window.StudioState.appointment(moveId);
      if (!live || !occupiesStatus(live.status)) break;
      const start = timeToMinutes(live.time) || SLOT_START;
      const slot = nextFreeSlot(live, live.date, start + SLOT_STEP);
      if (!slot || (slot.date === live.date && slot.time === live.time)) break;
      extrasMoved.push({
        id: live.id,
        from: live.date + " " + live.time,
        to: slot.date + " " + slot.time,
        reason: SEED_IDS.has(String(live.id)) ? "seed-shift" : "repair"
      });
      window.StudioState.upsertAppointment(
        { ...live, date: slot.date, time: slot.time },
        { skipConflict: true }
      );
    }
    moved.push.apply(moved, extrasMoved);

    const after = auditScheduleConflicts();
    const report = {
      beforeCount: before.conflicts.length,
      afterCount: after.conflicts.length,
      beforeMessage: before.message,
      afterMessage: after.message,
      moved,
      at: new Date().toISOString()
    };
    try {
      localStorage.setItem(MIGRATE_KEY, JSON.stringify(report));
    } catch (error) {
      /* ignore */
    }
    window.__studioAvailReport = report;
    return report;
  }

  window.StudioAvailability = {
    SLOT_STEP,
    occupiesStatus,
    timeToMinutes,
    minutesToTime,
    getServiceDuration,
    getProfessionalOccupancy,
    serviceTimeline,
    calculateAppointmentEnd,
    hasAppointmentConflict,
    getAvailableTimes,
    auditScheduleConflicts,
    migrateSeedAndRepair
  };

  migrateSeedAndRepair();
})();
