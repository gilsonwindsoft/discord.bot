const { DateTime } = require("luxon");

const ZONE = "America/Sao_Paulo";

const RECORRENCIAS = {
  diario: "diário",
  dias_uteis: "dias úteis",
  semanal: "semanal",
};

const FORMATOS_AJUDA =
  "Formatos aceitos: `HH:mm`, `dd/MM HH:mm`, `dd/MM/yyyy HH:mm` ou tempo relativo como `30m`, `2h`, `1h30m`, `1d`.";

function agoraSP() {
  return DateTime.now().setZone(ZONE);
}

function validaHora(hour, minute) {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

// Retorna o DateTime (America/Sao_Paulo) do texto informado, ou null se inválido/passado.
function parseQuando(texto, agora = agoraSP()) {
  const valor = String(texto || "")
    .trim()
    .toLowerCase();
  agora = agora.setZone(ZONE);
  let m;

  if ((m = valor.match(/^(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?$/)) && valor) {
    const [days, hours, minutes] = m.slice(1).map((n) => Number(n || 0));
    if (days + hours + minutes === 0) return null;
    const dt = agora.plus({ days, hours, minutes });
    return dt.isValid ? dt : null;
  }

  if ((m = valor.match(/^(\d{1,2}):(\d{2})$/))) {
    const [hour, minute] = m.slice(1).map(Number);
    if (!validaHora(hour, minute)) return null;
    const dt = agora.set({ hour, minute, second: 0, millisecond: 0 });
    return dt > agora ? dt : dt.plus({ days: 1 });
  }

  if ((m = valor.match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/))) {
    const [day, month, hour, minute] = m.slice(1).map(Number);
    if (!validaHora(hour, minute)) return null;
    const obj = { day, month, hour, minute };
    let dt = DateTime.fromObject({ ...obj, year: agora.year }, { zone: ZONE });
    if (dt.isValid && dt <= agora) {
      dt = DateTime.fromObject(
        { ...obj, year: agora.year + 1 },
        { zone: ZONE },
      );
    }
    return dt.isValid ? dt : null;
  }

  if (
    (m = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/))
  ) {
    const [day, month, year, hour, minute] = m.slice(1).map(Number);
    if (!validaHora(hour, minute)) return null;
    const dt = DateTime.fromObject(
      { day, month, year, hour, minute },
      { zone: ZONE },
    );
    return dt.isValid && dt > agora ? dt : null;
  }

  return null;
}

// Próxima ocorrência estritamente depois de `agora`, pulando as que já passaram.
function proximaOcorrencia(datahora, recorrencia, agora = agoraSP()) {
  let dt = (
    datahora instanceof Date ? DateTime.fromJSDate(datahora) : datahora
  ).setZone(ZONE);

  const passo = {
    diario: (d) => d.plus({ days: 1 }),
    semanal: (d) => d.plus({ weeks: 1 }),
    dias_uteis: (d) => {
      do d = d.plus({ days: 1 });
      while (d.weekday > 5);
      return d;
    },
  }[recorrencia];
  if (!passo) throw new Error(`Recorrência inválida: ${recorrencia}`);

  do dt = passo(dt);
  while (dt <= agora);
  return dt;
}

// Horários padrão do resumo de pendências; linhas do usuário sobrescrevem por posição.
const HORARIOS_PADRAO = [
  { posicao: 1, nome: "Manhã", horario: "08:00", ativo: true },
  { posicao: 2, nome: "Tarde", horario: "13:00", ativo: true },
  { posicao: 3, nome: "Fim do dia", horario: "17:00", ativo: true },
];

function validaHorario(texto) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(texto ?? ""));
}

function mesclarHorarios(linhas = []) {
  return HORARIOS_PADRAO.map((padrao) => {
    const linha = linhas.find((l) => Number(l.posicao) === padrao.posicao);
    return linha
      ? { ...padrao, horario: linha.horario, ativo: Boolean(linha.ativo) }
      : { ...padrao };
  });
}

function formatar(data) {
  const dt = data instanceof Date ? DateTime.fromJSDate(data) : data;
  return dt.setZone(ZONE).toFormat("dd/MM/yyyy HH:mm");
}

module.exports = {
  ZONE,
  RECORRENCIAS,
  FORMATOS_AJUDA,
  HORARIOS_PADRAO,
  agoraSP,
  parseQuando,
  proximaOcorrencia,
  formatar,
  validaHorario,
  mesclarHorarios,
};
