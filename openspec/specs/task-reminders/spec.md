# task-reminders Specification

## Purpose

Mantém visíveis as pendências de cada membro — tarefas em aberto e lembretes passados não concluídos — enviando um resumo automático por DM em horários diários configuráveis pelo próprio usuário.

## Requirements

### Requirement: Resumo automático de pendências

O bot SHALL enviar por mensagem direta (DM), a cada usuário que tenha ao menos uma pendência (tarefa pendente ou lembrete passado não concluído), um resumo em cada um dos seus horários ativos, somente de segunda a sexta-feira, no fuso `America/Sao_Paulo`. Os horários padrão MUST ser 08:00, 13:00 e 17:00, todos ativos, e MUST valer para qualquer usuário sem configuração própria, sem necessidade de inscrição. Usuários sem pendências MUST NOT receber resumo.

#### Scenario: Usuário com tarefas pendentes e configuração padrão

- **WHEN** chega uma segunda-feira às 08:00 e o usuário tem 3 tarefas pendentes e nunca alterou seus lembretes
- **THEN** o usuário recebe uma DM com o resumo das suas tarefas pendentes

#### Scenario: Usuário sem tarefas pendentes

- **WHEN** chega 13:00 de um dia útil, todas as tarefas do usuário estão concluídas e ele não tem lembretes passados não concluídos
- **THEN** o usuário não recebe nenhuma mensagem

#### Scenario: Só lembretes passados

- **WHEN** chega 17:00 de um dia útil, o usuário não tem tarefas pendentes e tem 1 lembrete passado não concluído
- **THEN** o usuário recebe o resumo contendo apenas esse lembrete

#### Scenario: Fim de semana

- **WHEN** chega sábado às 08:00 e o usuário tem tarefas pendentes
- **THEN** nenhum resumo é enviado

### Requirement: Conteúdo do resumo

Cada disparo SHALL gerar uma única mensagem por usuário. Quando houver tarefas pendentes, a mensagem MUST trazê-las no mesmo formato da listagem de `/tarefa listar` (incluindo o limite de itens exibidos e o botão **Marcar concluídas**). Quando houver lembretes passados não concluídos, a mensagem MUST listá-los (até 25, os mais antigos primeiro, com texto, data/hora agendada e criador quando for outra pessoa, indicando quantos não foram exibidos) com o botão **Concluir lembretes**. A mensagem MUST indicar que os horários podem ser configurados com `/tarefa lembretes`. Se dois horários ativos do usuário coincidirem, MUST ser enviada apenas uma mensagem naquele minuto.

#### Scenario: Marcar concluídas pelo lembrete

- **WHEN** o usuário clica em **Marcar concluídas** na DM do lembrete e marca duas tarefas
- **THEN** as duas tarefas ficam concluídas e a mensagem é atualizada com as pendentes restantes

#### Scenario: Resumo com tarefas e lembretes

- **WHEN** às 08:00 o usuário tem 2 tarefas pendentes e 1 lembrete passado não concluído
- **THEN** recebe uma única DM com a lista das 2 tarefas, a lista do lembrete e os botões **Marcar concluídas** e **Concluir lembretes**

#### Scenario: Horários repetidos

- **WHEN** o usuário configurou dois horários ativos para 13:00
- **THEN** recebe uma única mensagem às 13:00

### Requirement: Lembretes passados não concluídos

Um lembrete SHALL ser considerado passado não concluído quando não tem recorrência, já teve sua data/hora disparada (entregue ou com entrega falha) e não foi concluído, adiado nem descartado. Somente o destinatário MUST ver o lembrete no seu resumo. Lembretes recorrentes MUST NOT aparecer no resumo, pois voltam a disparar sozinhos. Lembretes com status entregue existentes antes desta mudança MUST ser tratados como concluídos.

#### Scenario: Lembrete entregue e ignorado

- **WHEN** um lembrete único foi entregue ontem às 15:00 e o destinatário não clicou em nenhum botão
- **THEN** o lembrete aparece em cada resumo do destinatário até ser concluído

#### Scenario: Lembrete para outra pessoa

- **WHEN** o usuário A criou um lembrete para B, já entregue e não concluído
- **THEN** o lembrete aparece no resumo de B e não no de A

#### Scenario: Lembrete recorrente

- **WHEN** um lembrete diário já disparou hoje e não foi concluído
- **THEN** ele não aparece no resumo

### Requirement: Concluir e adiar registram o encerramento

O botão **Concluir** da mensagem de um lembrete único SHALL registrar o lembrete como concluído, de modo que ele não apareça mais no resumo. O botão **Adiar 10 min** de um lembrete único SHALL, além de criar o novo lembrete adiado, encerrar o original, de modo que só o novo lembrete possa virar pendência. Em lembretes recorrentes, os botões MUST manter o comportamento atual (o original continua ativo). Somente o destinatário MUST poder usar os botões.

#### Scenario: Concluir pela mensagem do lembrete

- **WHEN** o destinatário clica em **Concluir** na DM de um lembrete único entregue
- **THEN** o lembrete deixa de aparecer nos resumos seguintes

#### Scenario: Adiar pela mensagem do lembrete

- **WHEN** o destinatário clica em **Adiar 10 min** num lembrete único entregue
- **THEN** o lembrete original deixa de aparecer no resumo e o novo lembrete é entregue 10 minutos depois

### Requirement: Concluir lembretes pelo resumo

O botão **Concluir lembretes** do resumo SHALL abrir um formulário com uma caixa de seleção por lembrete passado não concluído exibido. Ao enviar, os lembretes marcados MUST ser registrados como concluídos, considerando apenas lembretes cujo destinatário é quem clicou, e a mensagem do resumo MUST ser atualizada com as pendências restantes. Se não houver mais lembretes passados não concluídos ao clicar, a mensagem MUST ser atualizada sem abrir o formulário.

#### Scenario: Concluir dois lembretes pelo resumo

- **WHEN** o usuário clica em **Concluir lembretes**, marca 2 dos 3 lembretes listados e envia
- **THEN** os 2 lembretes ficam concluídos e o resumo passa a mostrar só o restante

### Requirement: Falha de entrega não interrompe os demais

Se a DM do resumo a um usuário não puder ser entregue (DMs bloqueadas, usuário inexistente), o bot MUST registrar o erro em log e MUST continuar enviando os resumos dos demais usuários. Não há entrega alternativa em canal.

#### Scenario: DM bloqueada

- **WHEN** o usuário A bloqueia DMs do bot e os usuários A e B têm pendências às 17:00
- **THEN** o erro de A é registrado em log e B recebe seu resumo normalmente

### Requirement: Consultar configuração dos lembretes

O subcomando `/tarefa lembretes` sem opções de alteração SHALL responder de forma efêmera com os três horários do usuário (manhã, tarde, fim do dia), o horário configurado de cada um e se está ativo ou desativado.

#### Scenario: Consulta com padrões

- **WHEN** um usuário que nunca alterou a configuração executa `/tarefa lembretes`
- **THEN** recebe resposta efêmera mostrando 08:00, 13:00 e 17:00, todos ativos

### Requirement: Alterar ou desativar um horário

O subcomando `/tarefa lembretes` SHALL aceitar a escolha de um dos três horários (manhã, tarde, fim do dia) junto com um novo horário no formato `HH:mm` (00:00–23:59) e/ou um indicador ativo/desativado. A alteração MUST afetar somente o horário escolhido e somente o próprio usuário, MUST persistir entre reinícios do bot e MUST valer a partir do minuto seguinte. Desativar um horário MUST preservar o horário configurado para uma futura reativação. Horário em formato inválido MUST ser rejeitado com mensagem efêmera de erro, sem alterar nada. Escolher um horário sem informar novo horário nem ativo/desativado MUST ser tratado como consulta. Após uma alteração, a resposta efêmera MUST mostrar a configuração atualizada.

#### Scenario: Desativar o lembrete da tarde

- **WHEN** o usuário executa `/tarefa lembretes horario:Tarde ativo:False`
- **THEN** a resposta mostra Tarde desativado (13:00)
- **AND** às 13:00 dos dias úteis seguintes o usuário não recebe resumo, mas continua recebendo os de manhã e fim do dia

#### Scenario: Alterar o horário da manhã

- **WHEN** o usuário executa `/tarefa lembretes horario:Manhã hora:09:30`
- **THEN** o resumo da manhã passa a ser enviado às 09:30 em vez de 08:00

#### Scenario: Reativar mantém o horário

- **WHEN** o usuário desativou Fim do dia configurado em 18:00 e depois executa `/tarefa lembretes horario:Fim do dia ativo:True`
- **THEN** o resumo volta a ser enviado às 18:00

#### Scenario: Horário inválido

- **WHEN** o usuário executa `/tarefa lembretes horario:Manhã hora:25:00`
- **THEN** recebe mensagem efêmera de erro e a configuração não muda

#### Scenario: Desativar todos

- **WHEN** o usuário desativa os três horários
- **THEN** não recebe mais resumos automáticos, até reativar algum
