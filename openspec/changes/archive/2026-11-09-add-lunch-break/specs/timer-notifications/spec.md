# Spec Delta

## MODIFIED Requirements

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
