# Design

## Context

- Ausência e timer são linhas de `apontamentos` (`Away`), diferenciadas só pela `descricao`; `/ausente` usa `descricao = 'Ausente'`. `TimerController` (`src/controllers/timer.js`) já tem `start`, `stop`, `setAwayRole` e `buildMessage(type, ...)`.
- `listarTimersAtivos` em `src/jobs.js` busca qualquer registro aberto (`datahora_fim: null`) — é daí que vem o lembrete a cada 5 min.
- O resumo das 18:30 agrupa por `usuario, descricao`, então `Almoço` aparece sozinho, sem mudança.

## Goals / Non-Goals

**Goals:** copiar o fluxo de `/ausente`/`/retornar` para o almoço com a menor diferença possível; tirar o almoço do lembrete periódico; não tirar o cargo `Ausente` de quem ainda está em outro registro que o usa.

**Non-Goals:** migrar ou ler as mensagens antigas `#almoço`/`#retorno`; limite de duração ou alerta de almoço longo; impedir abrir ausência e almoço ao mesmo tempo.

## Decisions

- **Descrição `Almoço` em `apontamentos`, sem esquema novo.** Mesma modelagem de `Ausente`. Alternativa (coluna `tipo`) exigiria migration e mudar todas as consultas; desnecessário.
- **Constante `LUNCH_DESCRIPTION = "Almoço"` exportada pelo `TimerController`.** Usada pelos comandos, pelo botão e pelo filtro do job, evitando string solta em quatro lugares.
- **Filtro no job:** `listarTimersAtivos` com `descricao: { [Op.ne]: "Almoço" }`. Alternativa (checar no loop) busca linhas à toa.
- **Cargo compartilhado:** `setAwayRole(client, away, false)` passa a verificar se existe outro registro aberto do mesmo usuário com `descricao IN ('Ausente','Almoço')` (excluindo o próprio `away.id`); se existir, não remove. A verificação fica dentro de `setAwayRole`, então `/retornar`, botão "Retornar", `/offrango` e **Voltei** herdam a regra sem mudança nos chamadores.
- **Embeds:** novos tipos `LUNCH_START` ("Almoço", `#E67E22`) e `LUNCH_FINISH` ("Almoço finalizado", `#57F287`) em `types`; `buildMessage` não muda.
- **Botão `rango-voltei-<id>`** (`startsWith`), igual a `ausente-retornar-`: fecha o almoço aberto de quem clicou, ignorando o `<id>`.
- **Textos efêmeros:** início "Bom rango! Clique em **Voltei** quando retornar."; já aberto "Você já está no almoço..."; fim "Você voltou do almoço."; sem almoço "Você não está no almoço.". Ajustáveis na implementação sem impacto na spec.

## Risks / Trade-offs

- [`/timer` com descrição `Almoço` se confunde com o almoço (some do lembrete, conta como almoço aberto)] → aceitável; caso raro, mesma colisão que já existe com `Ausente`.
- [Hábito `#almoço` continua] → fora do escopo; divulgação aos usuários.
- [Consulta extra por remoção de cargo] → uma consulta indexada por `usuario`; desprezível.

## Migration Plan

Sem migration. Deploy normal registra `/onrango` e `/offrango` no startup. Rollback: reverter o código; registros `Almoço` ficam como histórico e, sem o filtro, um almoço aberto voltaria a receber lembrete.
