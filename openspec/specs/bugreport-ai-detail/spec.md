# bugreport-ai-detail Specification

## Purpose

Permite que um membro da equipe solicite uma análise por IA de um bugreport publicado no Discord por um webhook do n8n e publica essa análise no canal.

## Requirements

### Requirement: Contrato do botão "detalhar"

Mensagens de bugreport são publicadas no Discord por um webhook do n8n, externo a este bot. Para acionar o detalhamento, a mensagem SHALL conter um botão com `customId` no formato `detalhar|<bugReportId>`. O bot MUST tratar qualquer botão cujo `customId` comece com `detalhar|`, e extrair como `bugReportId` o trecho entre o primeiro e o segundo `|` (string vazia se ausente).

#### Scenario: Id extraído

- **WHEN** o `customId` é `detalhar|1234`
- **THEN** o `bugReportId` enviado ao n8n é `1234`

#### Scenario: Id ausente

- **WHEN** o `customId` é `detalhar|`
- **THEN** o `bugReportId` enviado é a string vazia

### Requirement: Webhook de análise configurado

O detalhamento SHALL usar a URL definida em `N8N_BUGREPORT_WEBHOOK_URL`. Sem essa variável, o bot MUST responder de forma efêmera `❌ Webhook do n8n não configurado.` e não fazer nenhuma chamada.

#### Scenario: Variável ausente

- **WHEN** um usuário clica em "detalhar" e `N8N_BUGREPORT_WEBHOOK_URL` não está definida
- **THEN** recebe a resposta efêmera `❌ Webhook do n8n não configurado.`

### Requirement: Detalhamento único por botão

Cada botão "detalhar" (mensagem + `customId`) SHALL ser processado no máximo uma vez enquanto o processo do bot estiver em execução. Ao aceitar um clique, o bot MUST desabilitar apenas o botão clicado na mensagem original, mantendo os demais componentes.

#### Scenario: Clique repetido

- **WHEN** o mesmo botão é acionado de novo antes de o bot reiniciar (inclusive após uma falha)
- **THEN** o usuário recebe a resposta efêmera `Esse bugreport já está sendo detalhado.` e nenhuma nova chamada é feita

#### Scenario: Falha ao desabilitar o botão

- **WHEN** a edição da mensagem original falha
- **THEN** a falha é registrada no log e o detalhamento continua

### Requirement: Consulta à IA e publicação

Ao aceitar um clique, o bot SHALL adiar a resposta de forma pública e enviar `POST` com corpo JSON `{"bugReportId": "<id>"}` ao webhook. O texto da análise MUST ser lido de `output[0].content[0].text` na resposta. A análise MUST ser publicada no canal em blocos de até 2000 caracteres: o primeiro bloco como resposta e os demais como follow-ups, em ordem.

#### Scenario: Análise longa

- **WHEN** o webhook retorna um texto de 4500 caracteres
- **THEN** o bot publica 3 mensagens com 2000, 2000 e 500 caracteres

#### Scenario: Resposta sem texto

- **WHEN** a resposta do webhook não contém `output[0].content[0].text`
- **THEN** a resposta é `⚠️ A IA não retornou uma análise.`

#### Scenario: Erro na chamada

- **WHEN** a chamada ao webhook falha (erro de rede ou status HTTP fora de 2xx)
- **THEN** o erro é registrado e a resposta é `❌ Erro ao consultar a IA.`
- **AND** o botão permanece desabilitado

### Requirement: Sem restrição de quem aciona

Qualquer membro que consiga ver a mensagem SHALL poder acionar o detalhamento. O bot MUST NOT verificar papel ou identidade do usuário.

#### Scenario: Membro qualquer

- **WHEN** qualquer membro do canal clica em "detalhar"
- **THEN** o detalhamento é executado normalmente
