# Proposal

## Why

Hoje o bot só registra timers e ausências. A equipe quer usar o próprio Discord para ser lembrada de compromissos (inclusive lembrar colegas) e para manter uma lista simples de tarefas pessoais, sem depender de ferramentas externas. Além disso, o banco é criado com `model.sync()`, que não versiona mudanças de esquema; novas tabelas pedem um mecanismo de migrations.

## What Changes

- Novo comando `/lembrete` com subcomandos:
  - `criar`: texto + quando (`HH:mm`, `dd/MM HH:mm`, `dd/MM/yyyy HH:mm` ou relativo `30m`, `2h`, `1d`), destinatário opcional (outro membro do mesmo servidor) e recorrência opcional (diário, dias úteis, semanal).
  - `listar`: lembretes ativos criados pelo usuário ou destinados a ele.
  - `descartar`: cancela um lembrete ativo pelo id.
- Job que verifica lembretes vencidos a cada minuto e entrega por DM; se a DM falhar, posta no canal de origem mencionando o destinatário.
- Mensagem do lembrete com botões **Adiar 10 min** e **Concluir**.
- Novo comando `/tarefa` com subcomandos:
  - `adicionar`: abre modal multi-linha; cada linha `- [ ] texto` / `[ ] texto` vira tarefa pendente e `- [x] texto` vira tarefa concluída.
  - `listar`: tarefas pendentes do usuário com botões para concluir cada uma.
  - `concluir` e `remover`: por id.
  - `concluidas`: últimas tarefas concluídas.
- Migrations com Umzug executadas na inicialização, antes de o bot aceitar interações. Uma migration baseline cria `apontamentos` apenas se não existir, preservando dados atuais. **BREAKING** (operacional): `model.sync()` deixa de ser usado; toda mudança de esquema futura exige migration.

## Capabilities

### New Capabilities

- `reminders`: criação, listagem, descarte, entrega agendada, recorrência, adiamento e lembretes para outros membros do servidor.
- `task-list`: inclusão de tarefas via markdown `[ ]`/`[x]`, conclusão, remoção e listagem de pendentes/concluídas.

### Modified Capabilities

- `bot-runtime`: requisito "Conexão com o banco na inicialização" passa de criação automática de tabelas pelos modelos para execução de migrations versionadas.

## Impact

- Código novo: `src/interactions/Command/SlashCommand/lembrete.js`, `tarefa.js`; botões em `src/interactions/Button/Lembrete/` e `src/interactions/Button/Tarefa/`; modelos `src/models/lembrete.js`, `src/models/tarefa.js`; controllers `src/controllers/reminder.js`, `src/controllers/task.js`; `src/migrations/`.
- Código alterado: `src/database.js` (Umzug no lugar de `sync`), `src/index.js` (aguardar migrations antes do login), `src/jobs.js` (job de lembretes por minuto).
- Dependência nova: `umzug`.
- Banco: tabelas novas `lembretes`, `tarefas` e tabela de controle `SequelizeMeta`.
- Discord: dois novos slash commands globais registrados no startup. Intent continua só `Guilds` (opção de usuário em slash command resolve o membro sem intent privilegiado).
