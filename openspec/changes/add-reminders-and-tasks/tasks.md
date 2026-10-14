# Tasks

## 1. Migrations

- [x] 1.1 Adicionar `umzug` (v3, versão exata) com `bun add` e o script `"test": "bun test"` no `package.json`; verificar que `bun install` atualiza `bun.lock` sem erros
- [x] 1.2 Criar `src/migrations/0001-apontamentos.js` (cria `apontamentos` só se não existir, `down` no-op); verificar em banco vazio que a tabela tem as colunas listadas no delta de bot-runtime
- [x] 1.3 Criar `src/migrations/0002-lembretes.js` e `0003-tarefas.js` com colunas e índices do design.md (`down` remove a tabela); verificar com `SHOW CREATE TABLE`
- [x] 1.4 Reescrever `connectDatabase()` em `src/database.js`: `authenticate` e depois `umzug.up()` (logando migrations executadas), remover `sync` dos modelos, sair com código 1 em qualquer falha; verificar que uma migration quebrada impede o startup com código 1
- [x] 1.5 Fazer `src/index.js` aguardar `connectDatabase()` antes de `client.login` e `startJobs`, mantendo `module.exports = { client }` antes do login; verificar que `bun start` loga as migrations antes de `Ready! Logged in as`
- [x] 1.6 Verificar em cópia do banco de produção (`apontamentos` com dados, sem `SequelizeMeta`) que o startup registra `0001` sem alterar `apontamentos` e cria `lembretes`/`tarefas`; reiniciar e verificar que nenhuma migration roda de novo
- [x] 1.7 Atualizar `AGENTS.md` (Local Setup: migrations substituem auto-sync; novas migrations em `src/migrations`; `bun test` existe) e verificar que o texto bate com o comportamento implementado

## 2. Núcleo de lembretes (sem Discord)

- [x] 2.1 Criar `src/models/lembrete.js` (`tableName: "lembretes"`, sem sync); verificar que carrega com `bun -e "require('./src/models/lembrete')"`
- [x] 2.2 Implementar `parseQuando` e `proximaOcorrencia` em `src/utils/quando.js`; verificar com `src/utils/quando.test.js` cobrindo todos os cenários de "Formatos de data/hora aceitos" e "Recorrência" (hora passada → amanhã, `dd/MM` passado → próximo ano, relativo `1h30m`, zero/inválido/passado rejeitado, dias úteis sexta → segunda, ocorrências perdidas puladas) via `bun test`
- [x] 2.3 Implementar `src/controllers/reminder.js`: criar (checagens de membro/bot/limite 50), listar (criados ou recebidos, ordenados), descartar (só criador ou destinatário), adiar (novo único +10 min, fora do limite) e montagem de embed/botões com `allowedMentions` restrito ao destinatário; verificar conferindo cada requisito do spec contra o código

## 3. Entrega de lembretes

- [x] 3.1 Implementar a entrega no controller: buscar até 100 lembretes ativos vencidos, claim por UPDATE condicional (`affectedRows === 1`), DM e fallback no canal com menção, `falhou` em falha dupla, rodapé de atraso quando >2 min; verificar que um lembrete vencido é entregue uma única vez com duas execuções concorrentes (chamar a função duas vezes em paralelo numa execução local)
- [x] 3.2 Agendar o job em `src/jobs.js` com `cron.schedule("* * * * *", ..., { timezone })`; verificar com o bot rodando que um lembrete `quando:"1m"` chega em ~2 minutos
- [x] 3.3 Verificar reinício: criar lembrete, parar o bot até passar o horário, iniciar de novo e confirmar uma única entrega mostrando o horário original

## 4. Comando /lembrete e botões

- [x] 4.1 Criar `src/interactions/Command/SlashCommand/lembrete.js` com subcomandos `criar` (`texto` máx. 500, `quando`, `para` opcional, `repetir` com choices), `listar`, `descartar` (`id` inteiro), só em servidores, respostas efêmeras; verificar cada cenário do spec de reminders num servidor de teste, incluindo `para` com bot e com não-membro
- [x] 4.2 Criar `src/interactions/Button/Lembrete/adiar.js` (`lembrete-adiar-`, `startsWith`) e `concluir.js` (`lembrete-concluir-`) checando se quem clicou é o destinatário; verificar que adiar agenda +10 min e remove os botões, e que clique de outro usuário no fallback do canal recebe recusa efêmera
- [x] 4.3 Verificar que um `texto` com `@everyone` entregue via fallback no canal não notifica ninguém além do destinatário

## 5. Tarefas

- [x] 5.1 Criar `src/models/tarefa.js` (`tableName: "tarefas"`); verificar que carrega com `bun -e`
- [x] 5.2 Implementar `parseChecklist` em `src/utils/checklist.js`; verificar com `src/utils/checklist.test.js` (linhas mistas `- [ ]`/`[x]`/`* [X]`/texto puro, entrada só em branco, >200 caracteres informa a linha, >50 linhas) via `bun test`
- [x] 5.3 Implementar `src/controllers/task.js` (adicionar com `bulkCreate` em transação, listar pendentes em embed + "+N não exibidas", concluir filtrando por `usuario_id`, remover, últimas 10 concluídas); verificar conferindo cada requisito do spec de task-list contra o código
- [x] 5.4 Criar `src/interactions/Command/SlashCommand/tarefa.js` com subcomandos `adicionar` (modal + `awaitModalSubmit`, 10 min, timeout ignorado), `listar`, `concluir`, `remover`, `concluidas`; verificar cada cenário do spec de task-list num servidor de teste
- [x] 5.5 Substituir os botões por tarefa por um botão `tarefa-marcar` na listagem e criar `src/interactions/Button/Tarefa/marcar.js` que abre o modal de checkboxes, conclui as marcadas (filtrando por `usuario_id` e pendentes) e faz `submit.update` com a lista reconstruída; verificar que o modal JSON é aceito pelos builders e, num servidor de teste, que marcar 2 tarefas as remove da lista
- [x] 5.6 Encaminhar `isAutocomplete()` em `src/handlers/commands.js` para `command.autocomplete` e implementar o autocomplete da opção `id` de `/tarefa concluir` (pendentes) e `/tarefa remover` (todas); verificar num servidor de teste que digitar parte do texto sugere `🔲 texto` só com tarefas do próprio usuário

## 6. Integração

- [x] 6.1 Rodar `bun test`, `bun run lint:fix` e `bun start` completo em banco novo; verificar que `/lembrete` e `/tarefa` são registrados globalmente e que `/timer`, `/ausente` e `/retornar` não regrediram
- [x] 6.2 Rodar `openspec validate add-reminders-and-tasks --strict` e verificar que passa
