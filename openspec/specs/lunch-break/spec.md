# lunch-break Specification

## Purpose

Permite que um membro registre a saída e a volta do almoço pelo bot, publicando no canal o início, o fim e a duração, sem os lembretes periódicos aplicados a timers e ausências.

## Requirements

### Requirement: Modelo de almoço

Um almoço SHALL ser um registro de apontamento do usuário com descrição exatamente `Almoço`. Um almoço está aberto enquanto não tem data/hora de fim. Ao fechar, o sistema MUST gravar a data/hora de fim e a duração em segundos inteiros (arredondada para baixo). Um usuário MUST ter no máximo um almoço aberto.

#### Scenario: Fechar grava duração

- **WHEN** um almoço aberto às 12:00:00 é fechado às 13:02:30
- **THEN** o registro fica com fim 13:02:30 e duração 3750 segundos

### Requirement: Sair para o almoço com /onrango

O comando `/onrango` (sem opções) SHALL abrir um almoço para o usuário, vinculado ao canal onde o comando foi executado, e publicar no canal um embed "Almoço" com nome e avatar do usuário, campo "Início" (`dd/MM/yyyy HH:mm:ss`, fuso America/Sao_Paulo) e campo "Descrição" `Almoço`. O usuário MUST receber uma resposta efêmera confirmando o almoço com o botão **Voltei**. Se o usuário já tiver almoço aberto, MUST receber resposta efêmera informando isso e nada é criado nem publicado.

#### Scenario: Sair para o almoço

- **WHEN** um usuário sem almoço aberto executa `/onrango` às 12:00
- **THEN** um almoço é aberto, o embed "Almoço" com início 12:00 é publicado no canal e o usuário recebe a confirmação efêmera com o botão **Voltei**

#### Scenario: Almoço já aberto

- **WHEN** um usuário com almoço aberto executa `/onrango`
- **THEN** recebe resposta efêmera de que já está no almoço e nenhum registro novo é criado

### Requirement: Voltar do almoço com /offrango

O comando `/offrango` SHALL fechar o almoço aberto do usuário e publicar, no canal onde o almoço foi iniciado, um embed "Almoço finalizado" com os campos "Início", "Fim", "Duração" (por extenso em português) e "Descrição". O usuário MUST receber resposta efêmera confirmando a volta. Sem almoço aberto, o usuário MUST receber resposta efêmera informando que não está no almoço.

#### Scenario: Voltar do almoço

- **WHEN** um usuário que executou `/onrango` às 12:00 executa `/offrango` às 13:00
- **THEN** o almoço é fechado e o embed "Almoço finalizado" com duração de 1 hora é publicado no canal de origem

#### Scenario: Sem almoço aberto

- **WHEN** um usuário sem almoço aberto executa `/offrango`
- **THEN** recebe resposta efêmera de que não está no almoço e nada é publicado

### Requirement: Voltar do almoço pelo botão "Voltei"

O botão **Voltei** SHALL fechar o almoço aberto do usuário que clicou e publicar o embed "Almoço finalizado" no canal onde o botão foi clicado. A mensagem do botão MUST ser atualizada e ter os botões removidos. Se o usuário não tiver almoço aberto (por exemplo, já usou `/offrango`), a mensagem MUST ser atualizada informando isso, sem publicar embed.

#### Scenario: Clicar em Voltei

- **WHEN** um usuário com almoço aberto clica em **Voltei**
- **THEN** o almoço é fechado, o embed "Almoço finalizado" é publicado e o botão some da mensagem

#### Scenario: Botão depois de /offrango

- **WHEN** o usuário já fechou o almoço com `/offrango` e depois clica em **Voltei**
- **THEN** a mensagem informa que não está no almoço e nenhum embed é publicado

### Requirement: Cargo "Ausente" durante o almoço

Enquanto um usuário tem almoço aberto, o sistema SHALL manter nele o cargo `Ausente` no servidor do canal onde o almoço foi iniciado, com as mesmas regras de criação automática do cargo e de tolerância a falhas da ausência. Fechar o almoço MUST remover o cargo nesse servidor, exceto se o usuário ainda tiver uma ausência aberta. Falha de cargo MUST NOT impedir abrir ou fechar o almoço, publicar os embeds ou responder ao usuário.

#### Scenario: Almoço aplica o cargo

- **WHEN** um usuário executa `/onrango`
- **THEN** o usuário passa a ter o cargo `Ausente` no servidor

#### Scenario: Voltar do almoço com ausência aberta

- **WHEN** um usuário com ausência aberta e almoço aberto executa `/offrango`
- **THEN** o almoço é fechado e o cargo `Ausente` permanece

### Requirement: Almoço sem lembretes e no resumo diário

Um almoço aberto MUST NOT gerar o lembrete por DM de registro aberto. Um almoço fechado no dia SHALL entrar no resumo diário de tempo como grupo de descrição `Almoço`, como qualquer outro registro fechado.

#### Scenario: Almoço longo

- **WHEN** um almoço está aberto há 50 minutos numa quarta às 12:50
- **THEN** o usuário não recebe nenhum lembrete por DM

#### Scenario: Resumo das 18:30

- **WHEN** o usuário fechou um almoço de 1 hora no dia
- **THEN** o resumo das 18:30 inclui um embed `Almoço` com duração 1 hora, para o usuário e para o administrador
