# Proposal

## Why

Hoje a equipe marca o almoço escrevendo `#almoço` e `#retorno` no canal. Isso não registra o tempo, não aparece no resumo diário e depende de cada um lembrar o formato. `/ausente` resolveria o registro, mas dispara o lembrete por DM a cada 5 minutos ("timer ativo há mais de 10 minutos"), o que é ruído durante o almoço.

## What Changes

- Novo comando `/onrango`: abre um registro de almoço (descrição `Almoço`) vinculado ao canal, publica no canal um embed de início de almoço, aplica o cargo `Ausente` e responde de forma efêmera com o botão **Voltei**.
- Novo comando `/offrango` e botão **Voltei**: fecham o almoço, publicam no canal um embed de fim com início, fim e duração, e removem o cargo `Ausente`.
- O almoço **não** recebe o lembrete por DM de registro aberto enviado a cada 5 minutos.
- O almoço entra no resumo diário das 18:30 como linha `Almoço` (comportamento já existente do agrupamento por descrição).
- Cargo `Ausente` passa a ser compartilhado entre ausência e almoço: fechar um deles só remove o cargo se o usuário não tiver o outro aberto.

## Capabilities

### New Capabilities

- `lunch-break`: abrir e fechar almoço com `/onrango`, `/offrango` e botão **Voltei**, com tempo registrado e cargo `Ausente` durante o almoço.

### Modified Capabilities

- `absence-tracking`: requisito "Cargo "Ausente" durante a ausência" — o cargo só é removido ao fechar a ausência se o usuário não tiver almoço aberto.
- `timer-notifications`: requisito "Lembrete de registros abertos" — registros de almoço ficam fora do lembrete por DM.

## Impact

- Código novo: `src/interactions/Command/SlashCommand/onrango.js`, `offrango.js`; botão `src/interactions/Button/Almoco/voltei.js`.
- Código alterado: `src/controllers/timer.js` (tipos de embed do almoço; remoção do cargo condicionada a não haver outro registro aberto que use o cargo), `src/jobs.js` (filtro em `listarTimersAtivos`), `AGENTS.md`.
- Banco: nenhuma mudança de esquema; usa `apontamentos` com `descricao = 'Almoço'`.
- Discord: dois novos slash commands globais registrados no startup.
