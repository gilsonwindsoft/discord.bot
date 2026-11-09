# Design

## Context

- `/tarefa` (`src/controllers/task.js`) guarda tarefas só com `usuario_id` — sem guild/canal. Logo, o resumo só pode ir por DM.
- `/lembrete` (`src/controllers/reminder.js`) usa `lembretes.status` (STRING 16): `ativo`, `entregue`, `falhou`, `descartado`. Lembrete único vira `entregue` no claim da entrega; recorrente continua `ativo` com nova `datahora`. O botão **Concluir** hoje só edita a mensagem; **Adiar** cria um lembrete novo e não toca o original.
- `TaskController.montarPendentes(usuario_id)` já monta embed + botão `tarefa-marcar`, e o botão funciona em DM (usa `interaction.update`).
- Jobs em `src/jobs.js` usam `node-cron` com `timezone: "America/Sao_Paulo"`; já existe um cron por minuto para lembretes. Processo único (sem réplicas).
- Migrations Umzug em `src/migrations/NNNN-*.js`; próxima é `0004`.

## Goals / Non-Goals

**Goals:**

- Resumo por DM em até 3 horários por usuário, dias úteis, reaproveitando a listagem de tarefas existente.
- Configuração por horário persistida, com padrões implícitos (sem linha no banco = padrão).
- Tornar "lembrete passado não concluído" um estado consultável.

**Non-Goals:**

- Fallback de entrega em canal (tarefas não têm canal).
- Mais de 3 horários, configuração por dia da semana, feriados.
- Garantia de entrega exatamente-uma-vez entre réplicas ou reenvio de resumo perdido com o bot fora do ar (o resumo é periódico; o próximo horário cobre).
- Silenciar tarefas ou lembretes específicos do resumo.

## Decisions

### Tabela `tarefa_lembrete_horarios` com uma linha por (usuário, posição)

Colunas: `usuario_id` STRING(32), `posicao` TINYINT (1 manhã, 2 tarde, 3 fim do dia), `horario` STRING(5) `HH:mm`, `ativo` BOOLEAN; índice único `(usuario_id, posicao)`. Linha só existe quando o usuário altera aquela posição (upsert). Padrões (`08:00`, `13:00`, `17:00`, ativos) ficam numa constante no código.

Alternativa: uma linha por usuário com `horario_1..3`/`ativo_1..3` — mais colunas e código condicional por índice. Alternativa: JSON — sem validação e pior para consulta. Linha por posição mantém `horario` ao desativar (requisito de reativação) e é trivial de mesclar com os padrões.

### Job por minuto em dias úteis, cálculo em memória

Cron `* * * * 1-5` (São Paulo). A cada minuto:

1. `hhmm` atual em São Paulo (luxon).
2. Se `hhmm` não é um padrão e nenhuma linha de configuração ativa tem `horario = hhmm`, termina (barato: uma consulta indexada).
3. Candidatos = usuários com tarefa pendente ∪ destinatários com lembrete passado não concluído (dois `SELECT DISTINCT`).
4. Para cada candidato, mescla padrões + linhas do usuário; se algum horário ativo == `hhmm`, envia um resumo (dedupe natural de horários repetidos).

Alternativa: um cron por usuário/horário — exige recriar agendamentos ao mudar config e ao reiniciar. Rejeitada. O volume (equipe pequena) torna o cálculo em memória suficiente.

Sem coluna de "último envio": o cron dispara uma vez por minuto num único processo. Se o tick atrasar além do minuto, o resumo daquele horário se perde; aceitável (ver Riscos).

### Lembrete passado não concluído = `recorrencia IS NULL AND status IN ('entregue','falhou')`

Novos status: `concluido` (botão Concluir, do lembrete ou do resumo) e `adiado` (botão Adiar em lembrete único). Nenhuma mudança de esquema — coluna já é STRING(16). `falhou` entra porque o usuário nunca viu o lembrete.

- **Concluir** (mensagem do lembrete): `UPDATE status='concluido' WHERE id, destinatario_id, recorrencia IS NULL, status IN (entregue, falhou)`. Recorrente: sem mudança.
- **Adiar**: se único e `status IN (entregue, falhou)`, marcar original `adiado` antes de criar o novo. Recorrente: sem mudança.
- **Concluir lembretes** (resumo): botão `lembrete-pendentes-concluir` abre modal com CheckboxGroup, mesmo padrão de `tarefa-marcar` (`montarModalMarcar` do task controller serve de modelo; extrair a parte genérica só se o diff ficar menor que duplicar).
- Migration `0005` faz `UPDATE lembretes SET status='concluido' WHERE status='entregue'` — antes desta mudança Concluir não era persistido, então não há como distinguir; evita inundar o primeiro resumo com histórico antigo. `falhou` existentes ficam (nunca foram vistos). `down` é no-op.

### Mensagem do resumo

`montarResumo(usuario_id)` combina: embeds/componentes de `TaskController.montarPendentes` (quando houver tarefas) + embed de lembretes passados (até 25 linhas, ordem `datahora ASC`, `+N não exibido(s)`) + botão `Concluir lembretes`, numa ActionRow. Rodapé: "Configure os horários com /tarefa lembretes". Os dois botões precisam atualizar a mensagem inteira (tarefas + lembretes). Para distinguir do uso em `/tarefa listar`, o resumo usa customIds próprios (`resumo-tarefas-marcar`, `resumo-lembretes-concluir`) que reaproveitam a lógica de modal e chamam `montarResumo` no `update`. `allowedMentions: { parse: [] }` (texto livre e menções de criador).

### Comando `/tarefa lembretes`

Subcomando com opções opcionais: `horario` (integer choices: Manhã=1, Tarde=2, Fim do dia=3), `hora` (string `HH:mm`), `ativo` (boolean). Sem `horario`, ou com `horario` mas sem `hora`/`ativo`: só mostra. `hora`/`ativo` sem `horario`: erro efêmero pedindo o horário. Validação `^([01]\d|2[0-3]):[0-5]\d$` em helper puro (`src/utils/quando.js` já concentra parsing de hora) com teste. Resposta efêmera: embed com as 3 posições, horário e ✅/🔕.

## Risks / Trade-offs

- [Tick atrasado ou bot fora do ar no minuto exato perde aquele resumo] → aceitável; o próximo horário cobre. Não há reenvio retroativo.
- [Migration marca `entregue` antigos como `concluido`, escondendo algum lembrete realmente esquecido] → trade-off consciente para evitar resumo inicial com dezenas de itens falsos; documentado no proposal.
- [Muitos lembretes ou tarefas excedem limites do embed/modal] → mesmos limites já usados (25 exibidos, grupos de 10 no CheckboxGroup, até 5 grupos por modal → no máximo 25 itens no modal, igual ao exibido).
- [Spec `reminders` ainda na change não arquivada `add-reminders-and-tasks` diz que Concluir "apenas encerra a interação"] → requisito novo em `task-reminders`; ao arquivar `add-reminders-and-tasks` antes desta, ajustar o texto lá ou via delta MODIFIED nesta change.
- [DM bloqueada repete erro em log 3x por dia por usuário] → log em nível warn com id do usuário; aceitável.

## Migration Plan

1. Deploy aplica `0004` (tabela de horários) e `0005` (backfill de status) no startup.
2. Rollback: reverter código; `0004 down` dropa a tabela; `0005 down` no-op (lembretes `concluido` ficam fora de qualquer consulta antiga, que só olha `ativo`).
