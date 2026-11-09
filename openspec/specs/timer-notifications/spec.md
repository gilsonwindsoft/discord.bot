# timer-notifications Specification

## Purpose

Lembra os usuários, por mensagem direta, de registros deixados abertos e envia a cada usuário e ao administrador um resumo diário do tempo apontado.

## Requirements

### Requirement: Lembrete de registros abertos

Nos dias úteis (segunda a sexta), a cada 5 minutos entre 07:00 e 19:55 (America/Sao_Paulo), o bot SHALL enviar uma mensagem direta ao dono de cada registro aberto (timer ou ausência) há mais de 600 segundos. Registros de almoço (descrição `Almoço`) MUST NOT gerar este lembrete. A mensagem MUST ser um embed com título `Você tem um timer ativo a mais de 10 minutos!`, a descrição do registro, rodapé `Timer iniciado em dd/MM/yyyy HH:mm:ss` (America/Sao_Paulo) e cor `#0099ff`.

#### Scenario: Timer esquecido

- **WHEN** um timer está aberto há 30 minutos numa terça às 14:00
- **THEN** o dono recebe o lembrete, e volta a recebê-lo a cada execução de 5 minutos enquanto o timer estiver aberto

#### Scenario: Registro recente

- **WHEN** um registro está aberto há 8 minutos
- **THEN** nenhum lembrete é enviado

#### Scenario: Fora do horário

- **WHEN** é sábado ou são 20:00 de um dia útil
- **THEN** nenhum lembrete é enviado

#### Scenario: DM bloqueada

- **WHEN** o envio da DM a um usuário falha
- **THEN** a falha é registrada no log e os demais lembretes continuam

#### Scenario: Almoço aberto

- **WHEN** um almoço está aberto há 40 minutos numa terça às 12:40
- **THEN** nenhum lembrete é enviado para esse registro

### Requirement: Resumo diário de tempo

Nos dias úteis às 18:30 (America/Sao_Paulo), o bot SHALL somar a duração dos registros fechados no dia corrente, agrupados por usuário e descrição (incluindo ausências). Para cada grupo, MUST enviar ao usuário um embed com título `*Timers do dia:* <nome do usuário>`, campos "Duração" (por extenso em português) e "Descrição", e cor `#0099ff`. O mesmo embed MUST ser enviado ao administrador, identificado por um ID de usuário Discord fixo.

#### Scenario: Usuário com duas atividades

- **WHEN** um usuário fechou no dia timers `Reunião` (2 x 30 min) e `Deploy` (45 min)
- **THEN** recebe dois embeds: `Reunião` com 1 hora e `Deploy` com 45 minutos
- **AND** o administrador recebe cópia dos dois embeds

#### Scenario: Registro ainda aberto

- **WHEN** um timer está aberto às 18:30
- **THEN** ele não entra no resumo do dia

#### Scenario: Limites do dia

- **WHEN** o resumo calcula o "dia corrente"
- **THEN** os limites 00:00:00.000 a 23:59:59.999 são calculados no fuso horário do processo, não em America/Sao_Paulo

#### Scenario: Falha de envio

- **WHEN** o envio a um usuário ou ao administrador falha
- **THEN** a falha é registrada no log e os demais grupos continuam
