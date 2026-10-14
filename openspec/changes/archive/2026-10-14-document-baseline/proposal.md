# Proposal

## Why

O bot não possui especificações formais: o comportamento existe apenas no código e num README parcial (que não cobre notificações agendadas nem o detalhamento de bugreports). Registrar o comportamento atual como baseline permite que mudanças futuras sejam propostas como deltas sobre um contrato conhecido.

## What Changes

- Documentar o comportamento **atual (as-is)** do bot em 5 capabilities, sem qualquer alteração de código.
- Comportamentos questionáveis são especificados como estão hoje e listados em `design.md` (seção "Known issues") para virarem changes próprios.
- Registrar em `design.md` a arquitetura e os padrões de projeto em uso.

## Capabilities

### New Capabilities

- `bot-runtime`: configuração por ambiente, inicialização (banco, cliente Discord, jobs), descoberta e registro de interações, roteamento de comandos/botões, tratamento genérico de erros e healthcheck.
- `absence-tracking`: registro de ausência do usuário (`/ausente`) e retorno (`/retornar` e botão "Retornar").
- `activity-timer`: timers de atividade com descrição livre (`/timer`, em modo alternância) e botão "Finalizar".
- `timer-notifications`: lembretes por DM de timers abertos e resumo diário de tempo por DM ao usuário e ao administrador.
- `bugreport-ai-detail`: botão "detalhar" em mensagens de bugreport publicadas por webhook do n8n, que consulta outro webhook do n8n (IA) e publica a análise.

### Modified Capabilities

<!-- Nenhuma: não existem specs anteriores. -->

## Impact

- Código: nenhum arquivo de código alterado.
- Artefatos: novas specs em `openspec/specs/` após sync/archive deste change.
- Sistemas externos referenciados: Discord API, MySQL, webhooks do n8n.
