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

As configurações são feitas pelo arquivo `config.json`, para criá-lo, basta copiar o `config.example.json` e renomeá-lo para `config.json`. Depois disso, é só alterar com os dados de seu sistema.
