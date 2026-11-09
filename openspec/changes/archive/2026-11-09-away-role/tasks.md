# Tasks

## 1. Função do cargo no controller

- [x] 1.1 Adicionar `setAwayRole(client, away, ausente)` em `src/controllers/timer.js`: resolver o servidor por `client.channels.cache.get(away.channel_id)?.guild`; buscar o cargo `Ausente` em `guild.roles.cache` pelo nome; quando `ausente` for verdadeiro e o cargo faltar, criar com cor `#F1C40F`, `hoist: true`, `mentionable: false`, `permissions: []`; chamar `guild.members.addRole` ou `guild.members.removeRole` com `{ user: away.usuario, role }`; na remoção sem cargo, não fazer nada; todo erro vai para `logger.warn`/`logger.error` e não é relançado. Verificar com `bun -e "require('./src/controllers/timer')"` sem erro de sintaxe.

## 2. Pontos de entrada

- [x] 2.1 Em `src/interactions/Command/SlashCommand/ausente.js`, chamar `await TimerController.setAwayRole(interaction.client, timer, true)` depois de `TimerController.start`. Verificar manualmente: `/ausente` abre a ausência, publica o embed e adiciona o cargo; com o usuário já ausente, nenhum cargo muda.
- [x] 2.2 Em `src/interactions/Command/SlashCommand/retornar.js`, chamar `await TimerController.setAwayRole(interaction.client, finalTimer, false)` depois de `TimerController.stop`. Verificar manualmente: `/retornar` fecha a ausência e remove o cargo do servidor de origem.
- [x] 2.3 Em `src/interactions/Button/Ausente/retornar.js`, chamar `await TimerController.setAwayRole(interaction.client, finalTimer, false)` depois de `TimerController.stop`. Verificar manualmente: o botão "Retornar" fecha a ausência e remove o cargo.

## 3. Documentação e verificação integrada

- [x] 3.1 Atualizar `AGENTS.md` (seção Architecture): o controller de timer também gerencia o cargo `Ausente`, criado automaticamente, e o bot precisa da permissão Manage Roles. Verificar lendo o diff.
- [x] 3.2 Rodar `bun run lint:fix` e `bun test`; ambos sem erro.
- [x] 3.3 Teste manual em servidor de teste: (a) servidor sem cargo `Ausente`, `/ausente` cria o cargo exibido separadamente e cor `#F1C40F`; (b) dono do servidor recebe e perde o cargo; (c) bot sem Manage Roles: ausência e retorno funcionam e o log mostra a falha; (d) cargo removido manualmente antes de `/retornar`: retorno funciona normalmente.
