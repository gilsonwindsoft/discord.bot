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

### Requirement: Cargo "Ausente" durante a ausência

Enquanto um usuário tem ausência aberta, o sistema SHALL manter nele o cargo `Ausente` no servidor do canal onde a ausência foi iniciada. Abrir uma ausência com `/ausente` MUST adicionar o cargo. Fechar a ausência, por `/retornar` ou pelo botão "Retornar", MUST remover o cargo nesse mesmo servidor, exceto se o usuário ainda tiver um almoço aberto (que também usa o cargo `Ausente`). O comportamento MUST valer para qualquer membro, inclusive o dono do servidor.

#### Scenario: Iniciar ausência adiciona o cargo

- **WHEN** um usuário sem ausência aberta executa `/ausente` em um canal do servidor
- **THEN** a ausência é aberta e o usuário passa a ter o cargo `Ausente` nesse servidor

#### Scenario: Retornar por comando remove o cargo

- **WHEN** um usuário com ausência aberta executa `/retornar`
- **THEN** a ausência é fechada e o cargo `Ausente` é removido do usuário no servidor onde a ausência foi iniciada

#### Scenario: Retornar pelo botão remove o cargo

- **WHEN** um usuário com ausência aberta clica no botão "Retornar"
- **THEN** a ausência é fechada e o cargo `Ausente` é removido do usuário no servidor onde a ausência foi iniciada

#### Scenario: Dono do servidor

- **WHEN** o dono do servidor executa `/ausente`
- **THEN** o dono passa a ter o cargo `Ausente`, como qualquer outro membro

#### Scenario: Usuário já ausente

- **WHEN** um usuário com ausência aberta executa `/ausente`
- **THEN** nenhuma alteração de cargo é feita

#### Scenario: Retornar com almoço aberto

- **WHEN** um usuário com ausência aberta e almoço aberto executa `/retornar`
- **THEN** a ausência é fechada e o cargo `Ausente` permanece no usuário

### Requirement: Criação automática do cargo "Ausente"

Se o servidor não tiver um cargo chamado exatamente `Ausente` quando o sistema precisar adicioná-lo, o sistema SHALL criar o cargo com cor `#F1C40F`, exibido separadamente na lista de membros, não mencionável e sem permissões. Se o cargo já existir, o sistema MUST reutilizá-lo sem alterar suas configurações.

#### Scenario: Servidor sem o cargo

- **WHEN** um usuário executa `/ausente` em um servidor sem cargo `Ausente`
- **THEN** o cargo `Ausente` é criado com cor `#F1C40F`, exibido separadamente, não mencionável e sem permissões
- **AND** o cargo é adicionado ao usuário

#### Scenario: Cargo já existente

- **WHEN** um usuário executa `/ausente` em um servidor que já tem um cargo `Ausente`
- **THEN** o cargo existente é adicionado ao usuário e nenhum cargo novo é criado

### Requirement: Falha no cargo não bloqueia a ausência

Falha ao criar, adicionar ou remover o cargo `Ausente` (por exemplo, falta da permissão Manage Roles ou cargo acima do cargo do bot) MUST NOT impedir a abertura ou o fechamento da ausência, a publicação dos embeds ou as respostas ao usuário descritas nos demais requisitos. O sistema SHALL registrar a falha no log.

#### Scenario: Bot sem permissão Manage Roles

- **WHEN** um usuário executa `/ausente` e o bot não tem permissão para gerenciar cargos
- **THEN** a ausência é aberta, o embed "Ausência" é publicado e o usuário recebe a confirmação com o botão "Retornar"
- **AND** a falha do cargo é registrada no log

#### Scenario: Cargo removido manualmente antes do retorno

- **WHEN** um usuário com ausência aberta, sem o cargo `Ausente`, executa `/retornar`
- **THEN** a ausência é fechada normalmente e o usuário recebe `Você retornou ao trabalho.`
