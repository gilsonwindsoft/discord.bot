# Spec Delta

## Purpose

Define como o bot é configurado e inicializado, como descobre e roteia interações do Discord, como reporta falhas genéricas e como sua saúde é verificada.

## ADDED Requirements

### Requirement: Configuração obrigatória por ambiente

O bot SHALL ler sua configuração de variáveis de ambiente. `DISCORD_TOKEN` e `MYSQL_URL` MUST estar definidas; `N8N_BUGREPORT_WEBHOOK_URL` é opcional na inicialização e só é exigida pelo detalhamento de bugreports.

#### Scenario: Variável obrigatória ausente

- **WHEN** o processo inicia sem `DISCORD_TOKEN` ou sem `MYSQL_URL`
- **THEN** a inicialização falha com o erro `Missing required configuration: <NOME>` e o bot não se conecta ao Discord

#### Scenario: Webhook do n8n ausente

- **WHEN** o processo inicia sem `N8N_BUGREPORT_WEBHOOK_URL`
- **THEN** o bot inicia normalmente

### Requirement: Conexão com o banco na inicialização

Na inicialização o bot SHALL autenticar no MySQL e criar as tabelas dos modelos que ainda não existirem. Tabelas existentes MUST NOT ser alteradas automaticamente.

#### Scenario: Banco indisponível

- **WHEN** a autenticação no MySQL falha
- **THEN** o erro é registrado no log e o processo encerra com código 1

#### Scenario: Primeira execução

- **WHEN** a tabela `apontamentos` não existe
- **THEN** ela é criada com as colunas `usuario`, `descricao`, `datahora_inicio`, `datahora_fim`, `duracao_segundos`, `channel_id`, `createdAt` e `updatedAt`

### Requirement: Escopo de conexão com o Discord

O bot SHALL conectar ao gateway do Discord apenas com o intent `Guilds`. Ele MUST NOT depender de conteúdo de mensagens ou de eventos de membros.

#### Scenario: Login

- **WHEN** a configuração é válida
- **THEN** o bot faz login com o token e registra `Ready! Logged in as <tag>` ao ficar pronto

### Requirement: Descoberta automática de interações

Ao ficar pronto, o bot SHALL descobrir recursivamente todos os módulos de slash command e de botão em seus diretórios de interações. Um módulo sem `data` ou sem `execute` MUST ser ignorado com um aviso no log, sem interromper a carga dos demais.

#### Scenario: Módulo inválido

- **WHEN** um arquivo de interação não exporta `data` e `execute`
- **THEN** um aviso é registrado e os demais módulos são carregados

### Requirement: Registro global de slash commands

Ao ficar pronto, o bot SHALL substituir o conjunto global de slash commands da aplicação no Discord pelo conjunto descoberto localmente. Uma falha nesse registro MUST ser registrada no log sem derrubar o bot.

#### Scenario: Comando removido do código

- **WHEN** um módulo de comando deixa de existir e o bot reinicia
- **THEN** o comando deixa de estar registrado globalmente no Discord

#### Scenario: Falha na API do Discord

- **WHEN** a atualização dos comandos globais falha
- **THEN** o erro é registrado e o bot continua em execução

### Requirement: Roteamento de slash commands

O bot SHALL encaminhar cada slash command ao módulo cujo nome coincide exatamente com o nome do comando. Um comando sem módulo correspondente MUST ser registrado no log e não recebe resposta.

#### Scenario: Comando conhecido

- **WHEN** um usuário executa `/timer`
- **THEN** o módulo de nome `timer` é executado

### Requirement: Roteamento de botões por id exato ou prefixo

O bot SHALL encaminhar cada clique de botão ao módulo cujo nome coincide exatamente com o `customId` ou, para módulos que declaram correspondência por prefixo, cujo nome é prefixo do `customId`. Um botão sem módulo correspondente MUST ser registrado no log e não recebe resposta.

#### Scenario: Correspondência por prefixo

- **WHEN** um usuário clica num botão com `customId` `timer-finalizar-42`
- **THEN** o módulo de prefixo `timer-finalizar-` é executado

#### Scenario: Botão desconhecido

- **WHEN** nenhum módulo corresponde ao `customId`
- **THEN** o erro `No button matching <customId> was found.` é registrado e a interação fica sem resposta

### Requirement: Tratamento genérico de erros de interação

Quando a execução de um comando ou botão lança erro, o bot SHALL registrar o erro e responder ao usuário de forma efêmera: `There was an error while executing this command!` para comandos e `There was an error while executing this button!` para botões. Se a interação já foi respondida ou adiada, a mensagem MUST ser enviada como follow-up.

#### Scenario: Erro após resposta inicial

- **WHEN** um comando já respondeu e depois lança erro
- **THEN** o usuário recebe um follow-up efêmero com a mensagem de erro genérica

### Requirement: Healthcheck

O projeto SHALL fornecer um healthcheck que autentica no MySQL e termina com código 0 em caso de sucesso ou 1 em caso de falha. O deploy em contêiner MUST executá-lo a cada 30 s (timeout 10 s, 3 tentativas, período inicial de 30 s).

#### Scenario: Banco fora do ar

- **WHEN** o healthcheck não consegue autenticar no MySQL
- **THEN** imprime `Healthcheck failed: <mensagem>` e termina com código 1
