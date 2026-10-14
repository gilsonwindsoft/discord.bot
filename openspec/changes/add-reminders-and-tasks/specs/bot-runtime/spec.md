# Spec Delta

## MODIFIED Requirements

### Requirement: Conexão com o banco na inicialização

Na inicialização o bot SHALL autenticar no MySQL e aplicar, em ordem, todas as migrations versionadas ainda não aplicadas, registrando quais já foram executadas no próprio banco. O bot MUST concluir as migrations antes de fazer login no Discord e iniciar os jobs agendados. Tabelas MUST NOT ser criadas ou alteradas automaticamente a partir dos modelos. A migration inicial MUST criar `apontamentos` apenas se a tabela não existir, preservando os dados de instalações existentes.

#### Scenario: Banco indisponível

- **WHEN** a autenticação no MySQL falha
- **THEN** o erro é registrado no log e o processo encerra com código 1

#### Scenario: Falha em migration

- **WHEN** uma migration pendente falha
- **THEN** o erro é registrado no log, o processo encerra com código 1 e o bot não se conecta ao Discord

#### Scenario: Primeira execução

- **WHEN** o banco está vazio
- **THEN** são criadas as tabelas `apontamentos` (colunas `usuario`, `descricao`, `datahora_inicio`, `datahora_fim`, `duracao_segundos`, `channel_id`, `createdAt` e `updatedAt`), `lembretes` e `tarefas`

#### Scenario: Instalação existente

- **WHEN** a tabela `apontamentos` já existe com dados e nenhuma migration foi registrada
- **THEN** a migration inicial é registrada como aplicada sem alterar `apontamentos`, e as tabelas novas são criadas

#### Scenario: Reinício sem mudanças

- **WHEN** o bot reinicia e todas as migrations já foram aplicadas
- **THEN** nenhuma migration é executada novamente

## ADDED Requirements

### Requirement: Roteamento de autocomplete

O bot SHALL encaminhar cada pedido de sugestões (autocomplete) de uma opção de slash command ao módulo cujo nome coincide com o nome do comando, quando esse módulo declara tratamento de autocomplete. Pedidos para comandos sem tratamento de autocomplete MUST ser ignorados sem erro; uma falha no tratamento MUST ser registrada no log.

#### Scenario: Comando com autocomplete

- **WHEN** um usuário digita na opção `id` de `/tarefa concluir`
- **THEN** o tratamento de autocomplete do módulo `tarefa` responde com as sugestões

#### Scenario: Falha ao sugerir

- **WHEN** o tratamento de autocomplete lança erro
- **THEN** o erro é registrado no log e o bot continua em execução
