# Design

## Context

- `src/database.js` autentica e chama `model.sync()` (sem `await`) para cada arquivo em `src/models`. `src/index.js` não aguarda essa conexão: login e `startJobs` rodam em paralelo.
- Jobs (`src/jobs.js`) usam `node-cron` com `timezone: "America/Sao_Paulo"`; datas são formatadas com `luxon`.
- Interações: comandos e botões são descobertos por diretório; botões casam por `customId` exato ou prefixo (`startsWith`). Não existe roteamento de modais nem de select menus.
- Handlers fazem `require("../index")` para pegar `client` (dependência circular resolvida porque são carregados só no `ClientReady`).
- Intent apenas `Guilds`. Respostas efêmeras usam `ephemeral: true` (convenção atual).
- Não há suíte de testes; dependências fixadas em versão exata no `package.json`.

## Goals / Non-Goals

**Goals:**

- Esquema versionado por migrations, aplicado antes de qualquer acesso do bot ao banco.
- Entrega de lembretes que sobrevive a reinícios e nunca duplica uma ocorrência.
- Reaproveitar a estrutura atual (loader de comandos/botões, controllers, jobs) sem novo tipo de handler.

**Non-Goals:**

- Editar lembrete existente (descartar e recriar).
- Fuso horário por usuário (tudo em America/Sao_Paulo).
- Tarefas compartilhadas ou atribuídas a outros; tarefas são por usuário, não por servidor.
- Retry de entrega com backoff; fila externa.
- Migration de rollback automático em produção (as migrations terão `down`, mas reverter é manual).

## Decisions

### Migrations com Umzug no startup

`umzug` (v3, versão exata) com `SequelizeStorage` (tabela `SequelizeMeta`) e `context = sequelize.getQueryInterface()`. Migrations em `src/migrations/NNNN-nome.js` exportando `{ up, down }` em CommonJS. `connectDatabase()` passa a: `authenticate` → `umzug.up()`; falha em qualquer passo encerra com código 1. O carregamento de modelos para `sync` é removido.

- Alternativa: `sequelize-cli` — exige comando separado no deploy e arquivo `.sequelizerc`; descartado pela escolha do usuário e por simplificar o Docker.

### Migration baseline idempotente

`0001-apontamentos.js` verifica `queryInterface.showAllTables()`; se `apontamentos` existir, não faz nada; senão cria com as mesmas colunas que `sync()` gerava (`id` INTEGER auto-increment PK, `usuario`/`descricao`/`channel_id` VARCHAR(255), `datahora_inicio`/`datahora_fim` DATETIME, `duracao_segundos` INTEGER, `createdAt`/`updatedAt` DATETIME NOT NULL). `down` é no-op para nunca derrubar dados históricos.

### Ordem de inicialização

`src/index.js` cria e exporta `client` como hoje, depois executa `main()`: `await connectDatabase()` → `client.login(token)` → `startJobs(client)`. Isso cumpre "migrations antes do login" sem mexer nos handlers.

### Modelo de dados

`lembretes` (migration `0002`):
| coluna | tipo | nota |
|---|---|---|
| id | INTEGER PK AI | |
| criador_id | VARCHAR(32) | snowflake |
| destinatario_id | VARCHAR(32) | |
| guild_id, channel_id | VARCHAR(32) | canal de fallback |
| texto | VARCHAR(500) | |
| datahora | DATETIME | próxima ocorrência (UTC) |
| recorrencia | VARCHAR(16) NULL | `diario` \| `dias_uteis` \| `semanal` |
| status | VARCHAR(16) | `ativo` \| `entregue` \| `descartado` \| `falhou` |
| createdAt, updatedAt | DATETIME | |

Índices: `(status, datahora)` para o job; `(criador_id, status)` e `(destinatario_id, status)` para listar/limite.

`tarefas` (migration `0003`): `id`, `usuario_id` VARCHAR(32), `texto` VARCHAR(200), `concluida` BOOLEAN default false, `concluida_em` DATETIME NULL, `createdAt`, `updatedAt`. Índice `(usuario_id, concluida)`.

Modelos Sequelize em `src/models/lembrete.js` e `src/models/tarefa.js` com `tableName` explícito, sem `sync`.

### Parser de `quando` como função pura

`src/utils/quando.js` exporta `parseQuando(texto, agora)` → `DateTime` (luxon, zona America/Sao_Paulo) ou `null`, e `proximaOcorrencia(datahora, recorrencia, agora)`. Regras em `specs/reminders` ("Formatos de data/hora aceitos", "Recorrência"). Ordem de tentativa: relativo (`^(\d+d)?(\d+h)?(\d+m)?$`, não vazio, total > 0) → `HH:mm` → `dd/MM HH:mm` → `dd/MM/yyyy HH:mm`, validando com `DateTime.isValid`. Ser função pura permite testes com `bun test` sem Discord/banco.

- Alternativa: lib de linguagem natural (chrono-node) — dependência nova para formatos que o usuário não pediu.

### Entrega: claim condicional, depois envio (at-most-once)

Job `* * * * *` (timezone America/Sao_Paulo) busca até 100 lembretes `status='ativo' AND datahora <= now`. Para cada um, faz `UPDATE ... SET status/datahora = <novo> WHERE id = ? AND status = 'ativo' AND datahora = <antigo>`; só envia se `affectedRows = 1`. Único: novo status `entregue`. Recorrente: nova `datahora = proximaOcorrencia(...)` (pulando ocorrências passadas), status continua `ativo`. Ticks sobrepostos ou duas instâncias não duplicam.
Envio: `client.users.fetch(dest).send(...)`; em erro, `client.channels.fetch(channel_id).send(...)` mencionando o destinatário; em erro de novo, `status='falhou'` (apenas para único) e log.

- Alternativa: `setTimeout` por lembrete em memória — perde agendamentos no reinício e não escala; descartado.
- Trade-off aceito: se o processo morrer entre o claim e o envio, aquela ocorrência se perde (preferimos perder a duplicar).

### Mensagem do lembrete e menções

Embed com o texto (embeds não disparam menções), "Criado por <@criador>" quando diferente do destinatário, e rodapé com horário original se a entrega atrasar mais de 2 min. Todo envio usa `allowedMentions: { users: [destinatario_id] }`, impedindo que `@everyone`/cargos digitados no texto notifiquem alguém.
Botões: `lembrete-adiar-<id>` e `lembrete-concluir-<id>` (módulos com `startsWith`). Ambos carregam o lembrete pelo id e comparam `destinatario_id` com quem clicou. "Adiar" cria um novo lembrete único (copia texto/criador/destinatário/canal, `datahora = agora + 10 min`, não conta para o limite) e faz `interaction.update` sem botões.

### Destinatário em outro membro

Opção `para` (`addUserOption`). `interaction.options.getMember("para")` vem dos dados resolvidos da interação — não exige intent `GuildMembers`; `null` significa que não é membro do servidor. `getUser("para").bot` rejeita bots. Comando com `setDMPermission(false)` (e `setContexts(Guild)` se disponível na versão do discord.js) para restringir a servidores.

### Tarefas via modal aguardado no próprio comando

`/tarefa adicionar` chama `interaction.showModal()` com `customId` `tarefa-adicionar-<interaction.id>` e um `TextInputStyle.Paragraph` (max 4000), depois `interaction.awaitModalSubmit({ filter, time: 10 min })`. Timeout é ignorado silenciosamente. Assim não é preciso criar loader/handler de modais.
Parser `parseChecklist(texto)` em `src/utils/checklist.js` (função pura): regex `^\s*(?:[-*]\s+)?\[( |x|X)\]\s*(.*)$`; linhas sem checkbox viram pendentes; valida limites (200 por texto, 50 por envio) e retorna erro com número da linha. Inserção com `bulkCreate` numa transação.
`/tarefa listar` monta conteúdo `- 🔲 texto` (concluídas: `- ☑️ texto`; ids não são exibidos; emoji Unicode, pois o Discord não converte shortcodes enviados por bots) e um único botão `tarefa-marcar` (nome exato). O botão abre um modal com até 3 `Label` contendo um `CheckboxGroup` (componente de modal do Discord; máx. 10 opções por grupo, `required: false`, `min_values: 0`), cada opção com `value` = id e `label` = texto truncado em 100 caracteres. O modal é montado como objeto da API (`addLabelComponents({ type: Label, component: { type: CheckboxGroup, ... } })`), pois o `LabelBuilder` instalado não tem setter para checkbox. O botão aguarda o envio com `awaitModalSubmit` (mesmo padrão de `/tarefa adicionar`), lê os ids dos `values` de cada grupo presente em `fields.fields` (convertido para array: `Collection.flatMap` espera Collections; grupo ausente = nenhum marcado), conclui com `UPDATE ... WHERE id IN (...) AND usuario_id = clicker AND concluida = false` e faz `submit.update` com a lista reconstruída pela mesma função do controller.

- Alternativas: um botão por tarefa (visual poluído, rejeitado pelo usuário) e select menu múltiplo (exigiria roteamento de select menus).

### Autocomplete em `/tarefa concluir`

A opção `id` de `concluir` e de `remover` usa `setAutocomplete(true)` (sem ids visíveis, é a forma de escolher a tarefa). O handler de comandos passa a encaminhar `interaction.isAutocomplete()` para `command.autocomplete(interaction)` do módulo de mesmo nome (opcional por módulo). A busca filtra tarefas do usuário (só pendentes em `concluir`) por `texto LIKE %q%`, limita 25 e responde `{ name: "🔲|☑️ texto" (máx. 100), value: id }`.

### Controllers

`src/controllers/reminder.js` (criar, listar, descartar, entregar, adiar, montar embed/botões) e `src/controllers/task.js` (adicionar, listar/montar resposta, concluir, remover, concluídas), seguindo o padrão de `controllers/timer.js`. Comandos e botões ficam finos.

## Risks / Trade-offs

- [Componente CheckboxGroup é recente; clientes Discord desatualizados podem não renderizar o modal] → `/tarefa concluir` com autocomplete continua como alternativa.
- [Mensagem de lista com até 25 tarefas de 200 caracteres pode passar de 2000 caracteres] → usar embed `description` (limite 4096) e truncar textos longos na listagem.
- [Bot reiniciado com muitos lembretes vencidos] → lote de 100 por minuto; o restante sai nos minutos seguintes.
- [Migration baseline em banco onde `apontamentos` tem esquema diferente do esperado] → baseline não altera tabela existente; divergências continuam como hoje.
- [`ephemeral: true` está depreciado no discord.js 14.x] → manter convenção do projeto; migrar para `flags` fica fora do escopo.
- [Spam de lembretes para outros membros] → limite de 50 ativos por criador; destinatário pode descartar.
- [Lembretes recorrentes nunca terminam] → só param via `descartar`; aceito.

## Migration Plan

1. Deploy da nova imagem; no startup, Umzug registra `0001` (no-op em produção, pois `apontamentos` existe) e cria `lembretes` e `tarefas`.
2. Verificar no log a lista de migrations executadas e a tabela `SequelizeMeta`.
3. Rollback: voltar a imagem anterior. As tabelas novas e `SequelizeMeta` são ignoradas pelo código antigo; podem ser removidas manualmente se desejado.
