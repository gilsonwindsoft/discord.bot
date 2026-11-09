# Spec Delta

## MODIFIED Requirements

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
