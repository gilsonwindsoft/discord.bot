# absence-tracking Specification

## Purpose

Permite que um membro do servidor registre que está ausente do trabalho e depois retorne, publicando no canal o início, o fim e a duração da ausência.

## Requirements

### Requirement: Modelo de ausência

Uma ausência SHALL ser um registro de apontamento do usuário com descrição exatamente `Ausente`. Uma ausência está aberta enquanto não tem data/hora de fim. Ao fechar, o sistema MUST gravar a data/hora de fim e a duração em segundos inteiros (arredondada para baixo).

#### Scenario: Fechamento

- **WHEN** uma ausência iniciada às 10:00:00 é fechada às 10:15:30
- **THEN** o registro passa a ter fim 10:15:30 e duração 930 segundos

### Requirement: Iniciar ausência com /ausente

O comando `/ausente` (sem opções) SHALL abrir uma ausência para o usuário, vinculada ao canal onde o comando foi executado, e publicar no canal um embed "Ausência" (cor `#F1C40F`) com nome e avatar do usuário, campo "Início" (`dd/MM/yyyy HH:mm:ss`, fuso America/Sao_Paulo) e campo "Descrição" `Ausente`. O usuário MUST receber uma resposta efêmera `Você está ausente, clique no botão abaixo para retornar ao trabalho.` com o botão "Retornar".

#### Scenario: Usuário disponível

- **WHEN** um usuário sem ausência aberta executa `/ausente`
- **THEN** recebe a mensagem efêmera de espera `Aguarde, estamos registrando sua ausência...`
- **AND** uma ausência é aberta e o embed "Ausência" é publicado no canal
- **AND** a mensagem efêmera é substituída pelo texto de confirmação com o botão "Retornar"

#### Scenario: Usuário já ausente

- **WHEN** um usuário com ausência aberta executa `/ausente`
- **THEN** recebe apenas a resposta efêmera `Você já está ausente, clique no botão abaixo para retornar ao trabalho.`, sem botão, e nenhuma ausência nova é criada

### Requirement: Retornar com /retornar

O comando `/retornar` SHALL fechar a ausência aberta do usuário e publicar, no canal onde a ausência foi iniciada, um embed "Ausência finalizada" (cor `#57F287`) com os campos "Início", "Fim", "Duração" (por extenso em português) e "Descrição".

#### Scenario: Usuário ausente

- **WHEN** um usuário com ausência aberta executa `/retornar`
- **THEN** recebe a mensagem efêmera `Aguarde, estamos registrando seu retorno...`
- **AND** a ausência é fechada e o embed "Ausência finalizada" é publicado no canal de origem
- **AND** a mensagem efêmera é substituída por `Você retornou ao trabalho.`

#### Scenario: Usuário não ausente

- **WHEN** um usuário sem ausência aberta executa `/retornar`
- **THEN** recebe a resposta efêmera `Você não está ausente.`

### Requirement: Retornar pelo botão "Retornar"

O botão "Retornar" (`customId` `ausente-retornar-<id>`) SHALL fechar a ausência aberta do usuário que clicou, independentemente do `<id>` do botão, e publicar o embed "Ausência finalizada" no canal onde o botão foi clicado. A mensagem do botão MUST ser atualizada e ter os botões removidos.

#### Scenario: Retorno pelo botão

- **WHEN** o usuário com ausência aberta clica em "Retornar"
- **THEN** a ausência é fechada, o embed é publicado no canal atual e a mensagem passa a `Boa, você retornou ao trabalho!` sem botões

#### Scenario: Ausência já encerrada

- **WHEN** o usuário clica em "Retornar" sem ter ausência aberta (por exemplo, após usar `/retornar`)
- **THEN** a mensagem passa a `Você não está ausente.` sem botões
