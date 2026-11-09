const { test, expect, describe } = require("bun:test");
const { DateTime } = require("luxon");
const {
  parseQuando,
  proximaOcorrencia,
  validaHorario,
  mesclarHorarios,
  ZONE,
} = require("./quando");

const at = (iso) => DateTime.fromISO(iso, { zone: ZONE });
const fmt = (dt) => dt && dt.toFormat("yyyy-MM-dd HH:mm");

describe("parseQuando", () => {
  // quarta-feira, 14/10/2026 10:00
  const agora = at("2026-10-14T10:00:00");

  test("HH:mm futuro agenda para hoje", () => {
    expect(fmt(parseQuando("14:30", agora))).toBe("2026-10-14 14:30");
  });

  test("HH:mm que já passou agenda para amanhã", () => {
    expect(fmt(parseQuando("09:00", agora))).toBe("2026-10-15 09:00");
    expect(fmt(parseQuando("10:00", agora))).toBe("2026-10-15 10:00");
  });

  test("relativo", () => {
    expect(fmt(parseQuando("1h30m", agora))).toBe("2026-10-14 11:30");
    expect(fmt(parseQuando("30m", agora))).toBe("2026-10-14 10:30");
    expect(fmt(parseQuando("2H", agora))).toBe("2026-10-14 12:00");
    expect(fmt(parseQuando("1d", agora))).toBe("2026-10-15 10:00");
  });

  test("relativo zero é rejeitado", () => {
    expect(parseQuando("0m", agora)).toBeNull();
    expect(parseQuando("0d0h0m", agora)).toBeNull();
  });

  test("dd/MM HH:mm no ano atual ou no próximo", () => {
    expect(fmt(parseQuando("20/10 08:15", agora))).toBe("2026-10-20 08:15");
    expect(fmt(parseQuando("01/02 08:00", agora))).toBe("2027-02-01 08:00");
  });

  test("dd/MM/yyyy HH:mm futuro", () => {
    expect(fmt(parseQuando("25/12/2026 18:00", agora))).toBe(
      "2026-12-25 18:00",
    );
  });

  test("data completa no passado é rejeitada", () => {
    expect(parseQuando("01/01/2020 10:00", agora)).toBeNull();
  });

  test("valores inválidos são rejeitados", () => {
    for (const v of [
      "amanhã cedo",
      "",
      "25:00",
      "10:60",
      "31/02 10:00",
      "1x",
      "h",
    ]) {
      expect(parseQuando(v, agora)).toBeNull();
    }
  });
});

describe("proximaOcorrencia", () => {
  test("diário", () => {
    const agora = at("2026-10-14T09:00:30");
    expect(
      fmt(proximaOcorrencia(at("2026-10-14T09:00"), "diario", agora)),
    ).toBe("2026-10-15 09:00");
  });

  test("dias úteis na sexta vai para segunda", () => {
    const sexta = at("2026-10-16T09:00");
    expect(fmt(proximaOcorrencia(sexta, "dias_uteis", sexta))).toBe(
      "2026-10-19 09:00",
    );
  });

  test("semanal", () => {
    const d = at("2026-10-14T09:00");
    expect(fmt(proximaOcorrencia(d, "semanal", d))).toBe("2026-10-21 09:00");
  });

  test("ocorrências perdidas são puladas", () => {
    const agora = at("2026-10-17T12:00");
    expect(
      fmt(
        proximaOcorrencia(at("2026-10-14T09:00").toJSDate(), "diario", agora),
      ),
    ).toBe("2026-10-18 09:00");
  });
});

describe("validaHorario", () => {
  test("aceita HH:mm entre 00:00 e 23:59", () => {
    for (const h of ["00:00", "08:00", "09:30", "23:59"]) {
      expect(validaHorario(h)).toBe(true);
    }
  });

  test("rejeita formatos inválidos", () => {
    for (const h of ["24:00", "9:30", "ab:cd", "12:60", "", null]) {
      expect(validaHorario(h)).toBe(false);
    }
  });
});

describe("mesclarHorarios", () => {
  const resumo = (hs) => hs.map((h) => `${h.posicao} ${h.horario} ${h.ativo}`);

  test("sem linhas usa os padrões", () => {
    expect(resumo(mesclarHorarios())).toEqual([
      "1 08:00 true",
      "2 13:00 true",
      "3 17:00 true",
    ]);
  });

  test("posição desativada e horário alterado", () => {
    const linhas = [
      { posicao: 2, horario: "13:00", ativo: false },
      { posicao: 1, horario: "09:30", ativo: 1 },
    ];
    expect(resumo(mesclarHorarios(linhas))).toEqual([
      "1 09:30 true",
      "2 13:00 false",
      "3 17:00 true",
    ]);
  });
});
