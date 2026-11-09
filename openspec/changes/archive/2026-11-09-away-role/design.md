# Design

## Context

See proposal.md - Why. O bot usa só `GatewayIntentBits.Guilds` (discord.js 14.26). Com esse intent, o cache `guild.roles` vem completo, mas o cache de membros não. O registro em `apontamentos` não guarda o servidor, só `channel_id`. O botão "Retornar" vem de uma mensagem efêmera e publica no canal atual. Os três pontos de entrada (`/ausente`, `/retornar`, botão) já usam `src/controllers/timer.js`.

## Goals / Non-Goals

**Goals:**

- Lógica do cargo em um só lugar, chamada pelos três pontos de entrada.
- Nenhuma falha de cargo interrompe o fluxo atual da ausência.

**Non-Goals:**

- Nova coluna `guild_id` ou migração.
- Configuração do nome ou da cor do cargo.

## Decisions

**Servidor resolvido pelo `channel_id` da ausência.** O cargo é adicionado e removido no servidor de `client.channels.cache.get(away.channel_id).guild`. Assim o retorno remove o cargo do servidor certo mesmo se o usuário usar `/retornar` em outro servidor ou em DM. Alternativa: `interaction.guild`. Rejeitada porque falha nesses casos. Alternativa: coluna `guild_id`. Rejeitada porque exige migração sem ganho real, já que o canal identifica o servidor.

**Funções no controller de timer.** Adicionar em `src/controllers/timer.js` uma função `setAwayRole(client, away, ausente)`. Ela resolve o servidor, busca o cargo `Ausente` em `guild.roles.cache` pelo nome, cria com `guild.roles.create({ name: "Ausente", color: "#F1C40F", hoist: true, mentionable: false, permissions: [] })` se faltar, e chama `guild.members.addRole` ou `guild.members.removeRole` com `{ user, role }`. Esses métodos usam REST direto, então não precisam do membro no cache nem do intent `GuildMembers`. Todo o corpo fica em `try/catch` com `logger` e não relança erro. Alternativa: módulo novo `controllers/awayRole.js`. Rejeitada porque o controller de timer já centraliza a ausência.

**Chamada depois de gravar a ausência.** Em `/ausente`, a chamada ocorre depois de `TimerController.start`. Em `/retornar` e no botão, ocorre depois de `TimerController.stop`. A chamada é aguardada (`await`), mas não altera mensagens nem respostas ao usuário.

**Por que o dono do servidor funciona.** A hierarquia do Discord exige só que o cargo atribuído fique abaixo do cargo mais alto do bot. A posição do membro alvo não importa para adicionar ou remover cargo. O cargo criado pelo bot nasce na posição mais baixa, então atende a regra.

## Risks / Trade-offs

- [Dois `/ausente` simultâneos no mesmo servidor, sem cargo existente, podem criar dois cargos `Ausente`] → Mitigação: aceitar. Evento raro. Na próxima vez, a busca por nome usa o primeiro cargo encontrado. O admin pode apagar o duplicado.
- [Cargo removido do servidor ou renomeado durante uma ausência aberta] → Na remoção, se o cargo não existir, a função não cria cargo e não faz nada.
- [Bot reinicia ou cai durante a ausência] → Cargo continua no usuário até o retorno. É o comportamento desejado. Sem sincronização na inicialização (fora do escopo).
- [Admin move o cargo `Ausente` para cima do cargo do bot] → Discord recusa a operação. O erro vai para o log e o fluxo segue.
- [Canal da ausência apagado ou fora do cache] → Função não encontra o servidor, registra no log e não faz nada.

## Migration Plan

1. Dar a permissão Manage Roles ao cargo do bot em cada servidor.
2. Fazer o deploy. Nenhuma migração de banco.
3. Rollback: reverter o código. Remover o cargo `Ausente` manualmente, se quiser.
