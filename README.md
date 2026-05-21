# Discord Bot

## Introdução

Este é um bot de Discord que foi desenvolvido para ajudar os usuários a gerenciar suas ausências e timers de forma conveniente. Com este bot, os membros do servidor podem iniciar ou finalizar uma ausência e iniciar/finalizar um timer com uma descrição personalizada.

## Comandos

O bot oferece os seguintes comandos:

### /ausente

- **Descrição:** Inicia um período de ausência.
- **Como Usar:** Digite `/ausente` no canal de comando.
- **Exemplo:** `/ausente`
- **Observações:** Este comando registra o início da ausência e contabiliza o tempo até que o usuário retorne.

### /retornar

- **Descrição:** Marca o retorno do usuário após uma ausência.
- **Como Usar:** Digite `/retornar` no canal de comando.
- **Exemplo:** `/retornar`
- **Observações:** Este comando finaliza o período de ausência registrado anteriormente.

### /timer (descrição)

- **Descrição:** Inicia ou finaliza um timer com uma descrição personalizada.
- **Como Usar:** Digite `/timer (descrição)` no canal de comando, substituindo `(descrição)` pela descrição desejada para o timer.
- **Exemplo:** `/timer Reunião de Equipe`
- **Observações:** Este comando permite aos usuários registrar o início e o término de um timer para atividades específicas, como reuniões ou tarefas.

## Configuração

As configurações são feitas por variáveis de ambiente. Copie o `.env.example` para `.env` em ambiente local ou configure as variáveis diretamente no Coolify:

- `DISCORD_TOKEN`: token do bot no Discord.
- `MYSQL_URL`: URL de conexão MySQL, por exemplo `mysql://usuario:senha@host:3306/banco`.

## Execução

Instale as dependências com `bun install` e inicie o bot com `bun start`.
