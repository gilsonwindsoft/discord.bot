# Spec Delta

## ADDED Requirements

### Requirement: Cargo "Ausente" durante a ausência

Enquanto um usuário tem ausência aberta, o sistema SHALL manter nele o cargo `Ausente` no servidor do canal onde a ausência foi iniciada. Abrir uma ausência com `/ausente` MUST adicionar o cargo. Fechar a ausência, por `/retornar` ou pelo botão "Retornar", MUST remover o cargo nesse mesmo servidor. O comportamento MUST valer para qualquer membro, inclusive o dono do servidor.

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
