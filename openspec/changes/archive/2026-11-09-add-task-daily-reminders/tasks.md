# Tasks

## 1. Banco e modelos

- [x] 1.1 Criar `src/migrations/0004-tarefa-lembrete-horarios.js` (tabela `tarefa_lembrete_horarios`: `id`, `usuario_id` STRING(32), `posicao` TINYINT, `horario` STRING(5), `ativo` BOOLEAN, timestamps; índice único `(usuario_id, posicao)`; `down` dropa) e verificar com `bun start` que a migration é aplicada no log e a tabela existe
- [x] 1.2 Criar `src/migrations/0005-lembretes-entregues-concluidos.js` (`UPDATE lembretes SET status='concluido' WHERE status='entregue'`; `down` no-op) e verificar no banco que não restam lembretes `entregue` após o startup
- [x] 1.3 Criar modelo `src/models/tarefaLembreteHorario.js` mapeando a tabela (sem `sync`) e verificar que `require` carrega sem erro

## 2. Helpers puros

- [x] 2.1 Adicionar a `src/utils/quando.js` a validação de `HH:mm` (00:00–23:59) e a mescla de padrões (`08:00`, `13:00`, `17:00`, ativos) com linhas do usuário; cobrir com casos em `src/utils/quando.test.js` (válidos, `24:00`, `9:30`, `ab:cd`, mescla com posição desativada e com horário alterado) e verificar com `bun test`

## 3. Lembretes passados: status e botões existentes

- [x] 3.1 Em `src/controllers/reminder.js`, adicionar `listarPassados(usuario_id)` (destinatário, `recorrencia IS NULL`, `status IN ('entregue','falhou')`, `datahora ASC`), `concluirPassados(ids, usuario_id)` (só do destinatário) e marcar original como `adiado` em `adiar` quando único e `entregue`/`falhou`; verificar por inspeção do SQL gerado (log do Sequelize) em execução manual
- [ ] 3.2 Alterar `src/interactions/Button/Lembrete/concluir.js` para persistir `concluido` em lembrete único; verificar no Discord que clicar **Concluir** muda o status no banco e recorrentes continuam `ativo`
- [ ] 3.3 Verificar no Discord que **Adiar 10 min** em lembrete único marca o original `adiado` e cria o novo; em recorrente o original segue `ativo`

## 4. Resumo e job

- [x] 4.1 Implementar `montarResumo(usuario_id)` (tarefas via `TaskController.montarPendentes`, embed de lembretes passados até 25 com `+N não exibido(s)`, botões `resumo-tarefas-marcar` e `resumo-lembretes-concluir`, rodapé citando `/tarefa lembretes`, `allowedMentions: { parse: [] }`); retornar `null` sem pendências
- [ ] 4.2 Criar botões `src/interactions/Button/Resumo/tarefas.js` e `lembretes.js` com modal de CheckboxGroup (padrão de `tarefa-marcar`), concluindo os itens marcados e atualizando a mensagem com `montarResumo`; sem lembretes pendentes ao clicar, atualizar sem abrir modal; verificar no Discord em DM
- [ ] 4.3 Implementar `enviarResumos(client)` (hora atual SP, saída antecipada se nenhum horário bate, candidatos = tarefas pendentes ∪ destinatários com passados, horários efetivos do usuário, um envio por usuário, erro de DM logado sem interromper) e registrar em `src/jobs.js` com cron `* * * * 1-5` em `America/Sao_Paulo`; verificar alterando temporariamente um horário para o próximo minuto e recebendo a DM, e que usuário sem pendências não recebe

## 5. Comando `/tarefa lembretes`

- [ ] 5.1 Adicionar subcomando `lembretes` em `src/interactions/Command/SlashCommand/tarefa.js` com opções `horario` (choices Manhã=1, Tarde=2, Fim do dia=3), `hora` (string), `ativo` (boolean); consulta, upsert por `(usuario_id, posicao)` preservando `horario` ao desativar, erros efêmeros para `hora` inválida e para `hora`/`ativo` sem `horario`; verificar no Discord cada cenário da spec (consulta padrão, desativar Tarde, alterar Manhã para 09:30, reativar mantém horário, `25:00` rejeitado)

## 6. Documentação e integração

- [x] 6.1 Atualizar `AGENTS.md` (job de resumo por minuto em dias úteis, tabela `tarefa_lembrete_horarios`, novos status `concluido`/`adiado` de `lembretes`) e rodar `bun run lint:fix` e `bun test` sem erros
- [ ] 6.2 Verificação ponta a ponta: usuário com 2 tarefas e 1 lembrete passado recebe um único resumo no horário configurado; concluir pelos dois botões zera as pendências e o próximo horário não envia nada
