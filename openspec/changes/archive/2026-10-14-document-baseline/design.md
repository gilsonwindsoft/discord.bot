# Design

## Context

Bot de Discord em Bun/CommonJS (discord.js 14, Sequelize 6 sobre MySQL, node-cron, luxon, axios). Ver `proposal.md` (Why). Este change não altera código: o design registra a arquitetura e os padrões em uso para servir de referência a changes futuros, e lista os desvios conhecidos entre o comportamento atual e o comportamento provavelmente pretendido.

```
 env vars --> config.js  (DISCORD_TOKEN, MYSQL_URL obrigatórios; fail-fast)
                |
 src/index.js --+--> database.connectDatabase()  authenticate + sync models/*
                +--> Client(intents: Guilds) --ClientReady--> loaders + handlers
                +--> jobs.startJobs(client)      node-cron, America/Sao_Paulo

 loader/commands  scan interactions/Command -> client.commands -> REST PUT global
 loader/buttons   scan interactions/Button  -> client.buttons
 handlers/*       InteractionCreate -> lookup (nome exato | prefixo) -> execute

 interactions/Command/SlashCommand  /ausente  /retornar  /timer
 interactions/Button                ausente-retornar-*  timer-finalizar-*  detalhar|*
                    |                                                     |
 controllers/timer.js  start / stop / buildMessage                 axios -> n8n
                    |
 models/ausencia.js  Away -> tabela `apontamentos`
```

## Goals / Non-Goals

**Goals:**

- Documentar o comportamento observável atual, inclusive os comportamentos indesejados.
- Registrar padrões de projeto que um novo código deve seguir.

**Non-Goals:**

- Corrigir os problemas listados em "Known issues". Cada correção vira um change próprio que modifica as specs deste baseline.

## Decisions

### Padrões de projeto em uso

- **Plugin por convenção de diretório**: comandos e botões são descobertos recursivamente em `src/interactions/Command` e `src/interactions/Button`. Cada módulo exporta `{ data, execute }`. Adicionar uma interação = criar um arquivo; não há registro manual.
- **Registry + Dispatcher único**: `client.commands` e `client.buttons` (`Collection`) são consultados por um listener `InteractionCreate` por tipo de interação.
- **Estado no `customId`**: botões carregam contexto no id (`timer-finalizar-<id>`, `detalhar|<bugReportId>`), e o módulo declara `startsWith: true` para casar por prefixo. Não há estado de sessão no servidor.
- **Controller centralizado**: `controllers/timer.js` concentra persistência (`start`, `stop`) e apresentação (`buildMessage`). A tabela `types` mapeia o tipo de evento para título e cor do embed. Comandos e botões só orquestram.
- **Active Record com auto-sync**: modelos Sequelize em `src/models` sincronizados no startup (`sync()` sem `alter`). Não há migrations.
- **Entidade única com discriminador por valor**: ausências e timers compartilham a tabela `apontamentos`. A ausência é identificada por `descricao = 'Ausente'`. Um registro está aberto quando `datahora_fim IS NULL`.
- **Toggle por chave natural**: `/timer <descrição>` fecha o registro aberto com a mesma descrição ou abre um novo.
- **Feedback em duas fases**: reply efêmero de espera ("Aguarde...") seguido de `editReply`. O registro público vai como embed no canal.
- **Guarda de reentrância em memória**: `Set` por processo e desabilitação visual do botão, para evitar chamadas duplicadas ao n8n.
- **Fail-fast de configuração/infra**: `requireConfig` lança erro, e a falha de DB encerra com `process.exit(1)`. O healthcheck reaproveita a mesma autenticação.
- **Error boundary genérica**: os handlers capturam qualquer erro e respondem com mensagem efêmera padrão (reply ou followUp).
- **Jobs agendados com fuso explícito**: `node-cron` com `timezone: 'America/Sao_Paulo'`. O texto exibido também é formatado em São Paulo via luxon.

### Convenções

- CommonJS, indentação de 2 espaços, Prettier (`bun run lint:fix`).
- Textos ao usuário em português. Logs mistos (pt/en).
- Datas exibidas em `dd/MM/yyyy HH:mm:ss`. Durações por extenso via `humanize-duration` (`language: "pt"`).
- Embeds de evento: autor = `globalName` e avatar do usuário. Cores: ausência `#F1C40F`, timer iniciado `#3498DB`, finalizado `#57F287`, notificações `#0099ff`.

### Spec as-is

Alternativa considerada: especificar o comportamento pretendido. Foi rejeitada porque a spec divergiria do código desde o primeiro dia. Os desvios ficam abaixo.

## Risks / Trade-offs

### Known issues

1. **Botões ignoram o id do `customId`**: "Finalizar" fecha qualquer timer aberto não-"Ausente" do usuário, e com vários timers abertos pode fechar o errado. "Retornar" também ignora o id. Ver `activity-timer`, cenário "Vários timers abertos".
2. **Lembrete repetitivo**: o limiar é de 600 s, mas o job roda a cada 5 min. O usuário recebe DM a cada 5 min até fechar o registro, e ausências também geram lembrete com o texto "timer". O cron `*/5 7-19` vai até 19:55.
3. **Dia do resumo no fuso do processo**: `setHours` usa o fuso do servidor. Em contêiner UTC, o "dia" fica deslocado 3 h em relação a São Paulo.
4. **Resumo fragmentado**: uma DM por (usuário, descrição), mais uma cópia de cada para o admin. O título sugere um resumo único. Ausências entram no resumo.
5. **`/timer Ausente` colide** com o discriminador de ausência.
6. **Canal fora do cache**: `/retornar` e o fechamento via `/timer` usam `channels.cache.get(channel_id)`. Se o canal não estiver em cache, a interação lança erro depois de o registro já ter sido fechado.
7. **Constraints inexistentes**: `required: true` não é opção do Sequelize (o correto é `allowNull: false`), então as colunas aceitam NULL. O `defaultValue: new Date()` é avaliado uma vez no load do módulo. Hoje isso é inofensivo porque `start` sempre passa a data.
8. **`logger.debug` invertido**: imprime quando `NODE_ENV !== "development"`.
9. **Configuração incompleta**: `adminID` hardcoded em `jobs.js`. `N8N_BUGREPORT_WEBHOOK_URL` não está no `docker-compose.yaml` nem no README. `express` e `zod` são dependências não usadas.
10. **Reentrância permanente**: o `Set` de `processingDetails` nunca é limpo. Após falha não há retry até reiniciar o bot, e o Set cresce sem limite.
11. **`/ausente` já ausente** diz "clique no botão abaixo", mas não envia botão.
12. **Registro global de comandos** a cada startup: a propagação pode demorar, e qualquer remoção local apaga o comando em produção.
13. **Sem controle de concorrência**: dois `/timer X` simultâneos podem abrir dois registros iguais, porque a checagem e a criação não são atômicas.

[Specs as-is cristalizam bugs] → Cada item acima deve virar um change com delta `MODIFIED` na capability correspondente.
