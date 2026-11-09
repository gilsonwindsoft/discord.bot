# Tasks

## 1. Controller e job

- [x] 1.1 Em `src/controllers/timer.js`, exportar `LUNCH_DESCRIPTION = "Almoço"`, adicionar tipos `LUNCH_START` e `LUNCH_FINISH` e, em `setAwayRole` com `ausente = false`, não remover o cargo se o usuário tiver outro registro aberto com descrição `Ausente` ou `Almoço` (excluindo o próprio); verificar no Discord que `/retornar` com almoço aberto mantém o cargo e sem almoço remove
- [x] 1.2 Em `src/jobs.js`, excluir `descricao = 'Almoço'` de `listarTimersAtivos`; verificar com um almoço aberto há mais de 10 minutos (ajustando `datahora_inicio` no banco) que nenhuma DM chega no próximo ciclo de 5 min, enquanto um `/timer` aberto continua recebendo

## 2. Comandos e botão

- [x] 2.1 Criar `src/interactions/Command/SlashCommand/onrango.js` espelhando `ausente.js` (checa almoço aberto, `TimerController.start` com `LUNCH_DESCRIPTION`, `setAwayRole(..., true)`, embed `LUNCH_START` no canal, resposta efêmera com botão `rango-voltei-<id>`); verificar no Discord os cenários "Sair para o almoço" e "Almoço já aberto"
- [x] 2.2 Criar `src/interactions/Command/SlashCommand/offrango.js` espelhando `retornar.js` (embed `LUNCH_FINISH` no canal de origem); verificar no Discord "Voltar do almoço" (duração no embed) e "Sem almoço aberto"
- [x] 2.3 Criar `src/interactions/Button/Almoco/voltei.js` espelhando `Ausente/retornar.js` (`name: "rango-voltei-"`, `startsWith: true`); verificar no Discord "Clicar em Voltei" e "Botão depois de /offrango"

## 3. Documentação e integração

- [x] 3.1 Atualizar `AGENTS.md` (comandos `/onrango`/`/offrango`, descrição `Almoço` excluída do lembrete de 5 min, cargo `Ausente` compartilhado) e rodar `bun run lint:fix` e `bun test` sem erros
- [ ] 3.2 Verificação ponta a ponta num dia útil: `/onrango`, `/offrango` 1 h depois; conferir cargo aplicado e removido, nenhuma DM de lembrete no período e linha `Almoço` no resumo das 18:30
