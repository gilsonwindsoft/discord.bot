const { test, expect } = require("bun:test");
const { parseChecklist } = require("./checklist");

test("checklist misto", () => {
  const { tarefas } = parseChecklist(
    "- [ ] Revisar PR\n- [x] Atualizar dependências\nEscrever testes\n* [X] Deploy\n[ ] Sem marcador",
  );
  expect(tarefas).toEqual([
    { texto: "Revisar PR", concluida: false },
    { texto: "Atualizar dependências", concluida: true },
    { texto: "Escrever testes", concluida: false },
    { texto: "Deploy", concluida: true },
    { texto: "Sem marcador", concluida: false },
  ]);
});

test("linhas em branco são ignoradas", () => {
  expect(parseChecklist("\n  \n- [ ] A\r\n\n").tarefas).toEqual([
    { texto: "A", concluida: false },
  ]);
});

test("envio só com linhas em branco é erro", () => {
  expect(parseChecklist("\n   \n").erro).toBeDefined();
  expect(parseChecklist("- [ ]").erro).toBeDefined();
});

test("linha longa informa o número da linha", () => {
  const { erro, tarefas } = parseChecklist(
    `- [ ] ok\n- [ ] ${"a".repeat(201)}`,
  );
  expect(tarefas).toBeUndefined();
  expect(erro).toContain("linha 2");
});

test("mais de 50 tarefas é erro", () => {
  const texto = Array.from({ length: 51 }, (_, i) => `- [ ] t${i}`).join("\n");
  expect(parseChecklist(texto).erro).toBeDefined();
  expect(
    parseChecklist(texto.split("\n").slice(0, 50).join("\n")).tarefas,
  ).toHaveLength(50);
});
