# Spec Delta

## Purpose

Permite que um membro do servidor cronometre uma atividade com descrição livre, publicando quando começou, quando terminou e quanto durou.

## ADDED Requirements

### Requirement: Modelo de timer

Um timer SHALL ser um registro de apontamento do usuário com uma descrição livre. Um timer está aberto enquanto não tem data/hora de fim. Ao fechar, o sistema MUST gravar a data/hora de fim e a duração em segundos inteiros (arredondada para baixo). Um usuário MAY ter vários timers abertos ao mesmo tempo, desde que tenham descrições diferentes.

#### Scenario: Timers simultâneos

- **WHEN** um usuário inicia `/timer Reunião` e depois `/timer Deploy`
- **THEN** os dois timers ficam abertos ao mesmo tempo

### Requirement: /timer alterna início e fim pela descrição

O comando `/timer` SHALL exigir a opção de texto `descrição`. Se o usuário já tem um registro aberto com exatamente a mesma descrição, o comando MUST fechá-lo. Caso contrário, MUST abrir um novo timer vinculado ao canal atual.

#### Scenario: Iniciar timer

- **WHEN** um usuário sem timer aberto `Reunião` executa `/timer Reunião`
- **THEN** recebe a mensagem efêmera `Aguarde enquanto iniciamos seu timer...`
- **AND** um timer é aberto e o canal recebe um embed "Timer iniciado" (cor `#3498DB`) com nome e avatar do usuário, "Início" (`dd/MM/yyyy HH:mm:ss`, America/Sao_Paulo) e "Descrição"
- **AND** a mensagem efêmera é substituída por `Você iniciou um timer, clique no botão abaixo para finalizá-lo.` com o botão "Finalizar"

#### Scenario: Finalizar timer pela mesma descrição

- **WHEN** um usuário com timer aberto `Reunião` executa `/timer Reunião`
- **THEN** recebe a mensagem efêmera `Aguarde, estamos encerrando seu timer...`
- **AND** o timer é fechado e o canal onde ele foi iniciado recebe um embed "Timer finalizado" (cor `#57F287`) com "Início", "Fim", "Duração" (por extenso em português) e "Descrição"
- **AND** a mensagem efêmera é substituída por `Timer finalizado.`

#### Scenario: Descrição "Ausente"

- **WHEN** um usuário executa `/timer Ausente`
- **THEN** o registro é tratado como ausência: fecha a ausência aberta, se houver, ou abre um registro indistinguível de uma ausência

### Requirement: Finalizar pelo botão "Finalizar"

O botão "Finalizar" (`customId` `timer-finalizar-<id>`) SHALL fechar um timer aberto do usuário que clicou cuja descrição não seja `Ausente`, independentemente do `<id>` do botão, e publicar o embed "Timer finalizado" no canal onde o botão foi clicado. A mensagem do botão MUST ser atualizada e ter os botões removidos.

#### Scenario: Um timer aberto

- **WHEN** o usuário com um único timer aberto clica em "Finalizar"
- **THEN** o timer é fechado, o embed é publicado e a mensagem passa a `Seu timer foi finalizado!` sem botões

#### Scenario: Vários timers abertos

- **WHEN** o usuário tem os timers `Reunião` e `Deploy` abertos e clica em "Finalizar" na mensagem do timer `Deploy`
- **THEN** um dos timers abertos é fechado, sem garantia de que seja `Deploy`

#### Scenario: Nenhum timer aberto

- **WHEN** o usuário clica em "Finalizar" sem timers abertos
- **THEN** a mensagem passa a `Você não possui timers.` sem botões
