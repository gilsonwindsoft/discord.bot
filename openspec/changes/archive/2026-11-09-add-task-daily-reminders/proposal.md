# Proposal

## Why

As tarefas criadas com `/tarefa` só aparecem quando o usuário lembra de rodar `/tarefa listar`, e um lembrete de `/lembrete` entregue some no histórico da DM depois do disparo — em ambos os casos pendências ficam esquecidas. Hoje o botão **Concluir** do lembrete nem registra a conclusão, então o bot não sabe quais lembretes passados ainda estão em aberto. Um lembrete automático em horários fixos do dia mantém as tarefas em aberto visíveis sem esforço do usuário, e a configuração por usuário evita que o lembrete vire ruído.

## What Changes

- Job automático que, em dias úteis (seg–sex, `America/Sao_Paulo`), envia por DM a cada usuário com pendências um resumo nos horários padrão **08:00**, **13:00** e **17:00**.
- Pendências do resumo:
  - tarefas pendentes do usuário (mesmo formato de `/tarefa listar`, com o botão **Marcar concluídas**);
  - lembretes passados não concluídos destinados ao usuário: lembretes únicos (sem recorrência) já disparados (entregues ou com entrega falha) que não foram concluídos, adiados nem descartados, com botão **Concluir lembretes**.
- Cada disparo envia **uma** mensagem por usuário. Usuário sem nenhuma pendência não recebe nada.
- O botão **Concluir** da mensagem de `/lembrete` passa a registrar a conclusão; **Adiar 10 min** passa a encerrar o lembrete único original (o novo lembrete adiado assume a pendência). Lembretes já entregues antes desta mudança são considerados concluídos (o bot não tem como saber se foram).
- Os lembretes já vêm ativos para todos os usuários; não é preciso se inscrever.
- Novo subcomando `/tarefa lembretes` para o usuário:
  - ver seus três horários e se cada um está ativo;
  - desativar/reativar cada horário individualmente;
  - alterar o horário de disparo de cada um (`HH:mm`).
- Nova tabela de configuração por usuário, criada via migration. Usuários sem configuração usam os padrões.

## Capabilities

### New Capabilities

- `task-reminders`: resumo diário automático das tarefas pendentes e dos lembretes passados não concluídos, conclusão de lembretes passados e configuração por usuário dos três horários (ativar/desativar e alterar horário).

### Modified Capabilities

Nenhuma em `openspec/specs/`. A mudança no botão **Concluir**/**Adiar** altera o requisito "Adiar e concluir pela mensagem" da capacidade `reminders`, que ainda vive só na change não arquivada `add-reminders-and-tasks`; por isso o novo comportamento é especificado como requisito ADDED em `task-reminders`, e o texto do requisito de `reminders` deve ser ajustado ao arquivar aquela change.

## Impact

- Código novo: modelo e migration da configuração de horários (`src/migrations/0004-*.js`, `src/models/`), funções de envio/configuração no controller de tarefas (`src/controllers/task.js`) ou em um controller dedicado.
- Código alterado: `src/interactions/Command/SlashCommand/tarefa.js` (subcomando `lembretes`), `src/controllers/reminder.js` (consulta de passados, conclusão), `src/interactions/Button/Lembrete/concluir.js` e `adiar.js` (persistir status), novo botão para concluir lembretes pelo resumo, `src/jobs.js` (novo cron por minuto em dias úteis), `AGENTS.md`.
- Banco: nova tabela de configuração dos horários; novo valor de status `concluido` em `lembretes` (coluna STRING, sem mudança de esquema); migration que marca como `concluido` os lembretes com status `entregue` existentes.
- Discord: o comando global `/tarefa` é re-registrado no startup com o novo subcomando. Nenhum intent novo; entrega por DM.
- Depende da change `add-reminders-and-tasks` (capacidades `task-list` e `reminders`), já implementada mas ainda não arquivada.
