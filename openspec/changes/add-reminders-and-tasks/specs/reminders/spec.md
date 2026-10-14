# Spec Delta

## Purpose

Permite que um membro do servidor agende lembretes para si ou para outro membro do mesmo servidor e os receba do bot na data/hora escolhida, com opção de recorrência e adiamento.

## ADDED Requirements

### Requirement: Criar lembrete

O comando `/lembrete criar` SHALL exigir as opções `texto` (até 500 caracteres) e `quando`, e aceitar as opções `para` (usuário) e `repetir` (`diário`, `dias úteis`, `semanal`). O comando MUST estar disponível apenas dentro de servidores. Ao criar, o bot MUST responder de forma efêmera com o id do lembrete e a data/hora agendada no formato `dd/MM/yyyy HH:mm` (America/Sao_Paulo). O lembrete MUST guardar o canal onde foi criado.

#### Scenario: Lembrete para si mesmo

- **WHEN** um usuário executa `/lembrete criar texto:"Reunião" quando:"14:30"` às 10:00
- **THEN** um lembrete é agendado para hoje às 14:30 tendo o próprio usuário como destinatário
- **AND** o usuário recebe a resposta efêmera `Lembrete #<id> agendado para <dd/MM/yyyy> 14:30.`

#### Scenario: Comando fora de servidor

- **WHEN** um usuário tenta executar `/lembrete` por DM
- **THEN** o comando não fica disponível

### Requirement: Formatos de data/hora aceitos

A opção `quando` SHALL ser interpretada no fuso America/Sao_Paulo e aceitar: `HH:mm`; `dd/MM HH:mm`; `dd/MM/yyyy HH:mm`; e tempo relativo composto por `<n>d`, `<n>h` e `<n>m` (ex.: `30m`, `2h`, `1h30m`, `1d`). Apenas hora (`HH:mm`) que já passou hoje MUST agendar para amanhã. `dd/MM HH:mm` que já passou no ano atual MUST agendar para o ano seguinte. Uma data/hora completa no passado, um valor inválido ou um tempo relativo zero MUST ser rejeitado com mensagem efêmera explicando os formatos aceitos, sem criar o lembrete.

#### Scenario: Hora que já passou

- **WHEN** às 15:00 o usuário informa `quando:"09:00"`
- **THEN** o lembrete é agendado para amanhã às 09:00

#### Scenario: Tempo relativo

- **WHEN** às 10:00 o usuário informa `quando:"1h30m"`
- **THEN** o lembrete é agendado para hoje às 11:30

#### Scenario: Data completa no passado

- **WHEN** o usuário informa `quando:"01/01/2020 10:00"`
- **THEN** recebe uma mensagem efêmera de erro com os formatos aceitos e nenhum lembrete é criado

#### Scenario: Formato inválido

- **WHEN** o usuário informa `quando:"amanhã cedo"`
- **THEN** recebe uma mensagem efêmera de erro com os formatos aceitos e nenhum lembrete é criado

### Requirement: Lembrete para outro membro

A opção `para` SHALL permitir escolher outro usuário como destinatário. O destinatário MUST ser membro do servidor onde o comando foi executado e MUST NOT ser um bot. Ao ser entregue, o lembrete para outro membro MUST indicar quem o criou.

#### Scenario: Destinatário válido

- **WHEN** Ana executa `/lembrete criar texto:"Enviar relatório" quando:"17:00" para:@Bruno`
- **THEN** o lembrete é agendado com Bruno como destinatário e Ana como criadora
- **AND** às 17:00 Bruno recebe o lembrete informando que foi criado por Ana

#### Scenario: Destinatário bot

- **WHEN** o usuário escolhe um bot em `para`
- **THEN** recebe uma mensagem efêmera de erro e nenhum lembrete é criado

#### Scenario: Destinatário fora do servidor

- **WHEN** o usuário escolhido em `para` não é membro do servidor
- **THEN** recebe uma mensagem efêmera de erro e nenhum lembrete é criado

### Requirement: Limite de lembretes ativos

Um usuário SHALL ter no máximo 50 lembretes ativos criados por ele. Ao atingir o limite, a criação MUST ser rejeitada com mensagem efêmera.

#### Scenario: Limite atingido

- **WHEN** um usuário com 50 lembretes ativos tenta criar outro
- **THEN** recebe uma mensagem efêmera informando o limite e nenhum lembrete é criado

### Requirement: Listar lembretes ativos

O comando `/lembrete listar` SHALL responder de forma efêmera com os lembretes ativos que o usuário criou ou dos quais é destinatário, ordenados pela próxima data/hora. Cada item MUST mostrar id, data/hora, texto, recorrência (se houver) e, quando criador e destinatário diferem, o outro participante. Sem lembretes ativos, MUST responder `Você não tem lembretes ativos.`

#### Scenario: Lembretes próprios e recebidos

- **WHEN** um usuário tem um lembrete criado para si e outro criado por um colega para ele
- **THEN** a lista efêmera mostra os dois, com o colega indicado no segundo

#### Scenario: Nenhum lembrete

- **WHEN** um usuário sem lembretes ativos executa `/lembrete listar`
- **THEN** recebe `Você não tem lembretes ativos.`

### Requirement: Descartar lembrete

O comando `/lembrete descartar id:<n>` SHALL cancelar um lembrete ativo, incluindo todas as ocorrências futuras de um recorrente. Somente o criador ou o destinatário MUST poder descartá-lo. Lembrete inexistente, inativo ou de outra pessoa MUST resultar em `Lembrete não encontrado.` (efêmero).

#### Scenario: Descarte pelo destinatário

- **WHEN** Bruno descarta um lembrete que Ana criou para ele
- **THEN** o lembrete é cancelado e não é mais entregue

#### Scenario: Lembrete de terceiros

- **WHEN** um usuário tenta descartar um lembrete do qual não é criador nem destinatário
- **THEN** recebe `Lembrete não encontrado.` e o lembrete continua ativo

### Requirement: Entrega agendada

O bot SHALL verificar a cada minuto os lembretes ativos com data/hora vencida e entregá-los ao destinatário por mensagem direta, com o texto, os botões "Adiar 10 min" e "Concluir" e, quando aplicável, o criador. Se a mensagem direta falhar, o bot MUST postar no canal de origem mencionando o destinatário. Se ambas falharem, o lembrete MUST ser marcado como falho e o erro registrado no log. Um lembrete MUST ser entregue no máximo uma vez por ocorrência, mesmo após reinício do bot. Lembretes vencidos enquanto o bot estava fora do ar MUST ser entregues na primeira verificação após o reinício, indicando o horário original.

#### Scenario: Entrega por DM

- **WHEN** chega a data/hora de um lembrete e o destinatário aceita DMs
- **THEN** o destinatário recebe a DM com o texto e os botões e o lembrete deixa de estar ativo (se não recorrente)

#### Scenario: DM bloqueada

- **WHEN** a DM ao destinatário falha
- **THEN** o lembrete é postado no canal de origem mencionando o destinatário

#### Scenario: Bot fora do ar

- **WHEN** o bot volta após ficar fora do ar durante o horário de um lembrete
- **THEN** o lembrete é entregue na primeira verificação, informando o horário original agendado

### Requirement: Recorrência

Um lembrete com `repetir` SHALL, após cada entrega, ser reagendado para a próxima ocorrência a partir do horário agendado: `diário` (+1 dia), `dias úteis` (próximo dia de segunda a sexta), `semanal` (+7 dias). Ocorrências que já passaram MUST ser puladas sem entrega, de modo que apenas uma entrega ocorra por verificação. Um lembrete recorrente permanece ativo até ser descartado.

#### Scenario: Dias úteis na sexta

- **WHEN** um lembrete `dias úteis` às 09:00 é entregue numa sexta-feira
- **THEN** o próximo é agendado para segunda-feira às 09:00

#### Scenario: Ocorrências perdidas

- **WHEN** um lembrete `diário` às 09:00 ficou três dias sem verificação
- **THEN** é entregue uma única vez e reagendado para a próxima 09:00 futura

### Requirement: Adiar e concluir pela mensagem

O botão "Adiar 10 min" SHALL criar um novo lembrete único com o mesmo texto, destinatário e criador para 10 minutos após o clique, sem alterar a recorrência do original. O botão "Concluir" SHALL apenas encerrar a interação. Em ambos os casos a mensagem MUST ter os botões removidos e indicar a ação tomada. Somente o destinatário MUST poder usar os botões; outro usuário recebe uma mensagem efêmera de recusa.

#### Scenario: Adiar

- **WHEN** o destinatário clica "Adiar 10 min" às 14:31
- **THEN** um lembrete é agendado para 14:41 e a mensagem passa a indicar o adiamento sem botões

#### Scenario: Outro usuário clica no canal

- **WHEN** um usuário que não é o destinatário clica num botão do lembrete postado no canal
- **THEN** recebe uma recusa efêmera e a mensagem não muda
