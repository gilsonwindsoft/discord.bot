const MAX_TEXTO = 200;
const MAX_TAREFAS = 50;

// Converte um checklist markdown em tarefas. Retorna { tarefas } ou { erro }.
function parseChecklist(texto) {
  const tarefas = [];
  const linhas = String(texto || "").split(/\r?\n/);

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    const m = linha.match(/^(?:[-*]\s+)?\[( |x|X)\]\s*(.*)$/);
    const item = m
      ? { texto: m[2].trim(), concluida: m[1] !== " " }
      : { texto: linha, concluida: false };

    if (!item.texto) continue;
    if (item.texto.length > MAX_TEXTO) {
      return {
        erro: `A linha ${i + 1} passa de ${MAX_TEXTO} caracteres.`,
      };
    }
    tarefas.push(item);
  }

  if (!tarefas.length) return { erro: "Nenhuma tarefa informada." };
  if (tarefas.length > MAX_TAREFAS) {
    return { erro: `Envie no máximo ${MAX_TAREFAS} tarefas por vez.` };
  }
  return { tarefas };
}

module.exports = { parseChecklist, MAX_TEXTO, MAX_TAREFAS };
