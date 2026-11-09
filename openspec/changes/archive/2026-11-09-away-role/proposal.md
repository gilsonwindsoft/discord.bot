# Proposal

## Why

Hoje a ausência só aparece como embed no canal. Quem vai mandar mensagem não sabe se a pessoa está fora sem procurar o histórico. A API do Discord não permite que um bot altere o status (online/ausente/offline) de outro usuário. A alternativa que funciona para todos os membros, inclusive o dono do servidor, é um cargo "Ausente" com cor e exibido separadamente na lista de membros.

## What Changes

- `/ausente` passa a adicionar o cargo "Ausente" ao usuário no servidor onde a ausência foi iniciada.
- `/retornar` e o botão "Retornar" passam a remover esse cargo.
- O bot cria o cargo "Ausente" automaticamente na primeira vez que precisar dele, caso não exista no servidor (cor `#F1C40F`, exibido separadamente, sem permissões, não mencionável).
- Falha ao criar, adicionar ou remover o cargo (por exemplo, falta de permissão Manage Roles) não impede o registro da ausência nem do retorno. A falha é registrada no log.
- O bot passa a precisar da permissão **Manage Roles** no servidor.

Fora do escopo:

- Alterar o status de presença do usuário (impossível pela API).
- Sincronizar cargos com ausências abertas na inicialização do bot.
- Avisar quem menciona um usuário ausente (exigiria intents de mensagem).

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `absence-tracking`: iniciar ausência adiciona o cargo "Ausente"; retornar (comando ou botão) remove o cargo; o cargo é criado automaticamente se não existir.

## Impact

- `src/controllers/timer.js`: novas funções para garantir o cargo e para adicioná-lo ou removê-lo.
- `src/interactions/Command/SlashCommand/ausente.js`, `src/interactions/Command/SlashCommand/retornar.js`, `src/interactions/Button/Ausente/retornar.js`: chamam as funções do cargo.
- Configuração do bot no Discord: convite/cargo do bot precisa da permissão Manage Roles. Sem novas variáveis de ambiente, migrações ou dependências.
