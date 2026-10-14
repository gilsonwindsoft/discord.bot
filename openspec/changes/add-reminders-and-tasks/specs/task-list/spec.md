# Spec Delta

## Purpose

Permite que cada membro mantenha uma lista pessoal de tarefas escrita em markdown de checklist (`[ ]` / `[x]`), marcando-as como concluídas e consultando as pendentes pelo Discord.

## ADDED Requirements

### Requirement: Adicionar tarefas por checklist markdown

O comando `/tarefa adicionar` SHALL abrir um formulário (modal) com um campo de texto multi-linha de até 4000 caracteres. Ao enviar, cada linha não vazia MUST virar uma tarefa do usuário: linhas no formato `[ ] texto` ou `- [ ] texto` (também `*`) viram pendentes; `[x] texto` ou `- [x] texto` (x maiúsculo ou minúsculo) viram concluídas; linhas sem caixa de seleção viram pendentes. O texto de cada tarefa MUST ter no máximo 200 caracteres e cada envio no máximo 50 tarefas; se algum limite for excedido, nada é criado e o usuário recebe mensagem efêmera de erro. Em caso de sucesso, o bot MUST responder de forma efêmera com a quantidade de tarefas pendentes e concluídas criadas.

#### Scenario: Checklist misto

- **WHEN** o usuário envia o formulário com:
  ```
  - [ ] Revisar PR
  - [x] Atualizar dependências
  Escrever testes
  ```
- **THEN** são criadas "Revisar PR" e "Escrever testes" pendentes e "Atualizar dependências" concluída
- **AND** o usuário recebe `2 tarefa(s) pendente(s) e 1 concluída(s) adicionadas.`

#### Scenario: Envio vazio

- **WHEN** o formulário é enviado só com linhas em branco
- **THEN** nenhuma tarefa é criada e o usuário recebe mensagem efêmera de erro

#### Scenario: Linha longa demais

- **WHEN** uma linha tem texto com mais de 200 caracteres
- **THEN** nenhuma tarefa é criada e o erro indica a linha

### Requirement: Tarefas são pessoais

Cada tarefa SHALL pertencer ao usuário que a criou. Listagem, conclusão e remoção MUST considerar apenas tarefas do próprio usuário; ids de tarefas de outra pessoa MUST ser tratados como inexistentes.

#### Scenario: Id de outro usuário

- **WHEN** um usuário tenta concluir a tarefa de id de outra pessoa
- **THEN** recebe `Tarefa não encontrada.` e a tarefa não muda

### Requirement: Listar tarefas pendentes

O comando `/tarefa listar` SHALL responder de forma efêmera com as tarefas pendentes do usuário em ordem de criação, no formato `- 🔲 texto` (emoji `:black_square_button:`), exibindo no máximo 25, e um único botão "☑️ Marcar concluídas". Se houver mais de 25 pendentes, a resposta MUST informar quantas não aparecem. Sem pendentes, MUST responder `Você não tem tarefas pendentes.`

#### Scenario: Lista com pendentes

- **WHEN** um usuário com 3 tarefas pendentes executa `/tarefa listar`
- **THEN** vê as 3 tarefas e o botão "☑️ Marcar concluídas"

#### Scenario: Nenhuma pendente

- **WHEN** um usuário sem tarefas pendentes executa `/tarefa listar`
- **THEN** recebe `Você não tem tarefas pendentes.`

### Requirement: Concluir tarefa

Uma tarefa pendente SHALL poder ser concluída pelo formulário de caixas de seleção aberto pelo botão "☑️ Marcar concluídas" da listagem ou pelo comando `/tarefa concluir id:<n>`. A conclusão MUST registrar a data/hora. O formulário MUST mostrar as mesmas tarefas pendentes exibidas na listagem (até 25), uma caixa por tarefa com o texto da tarefa, e permitir marcar várias de uma vez. Ao enviar, as tarefas marcadas MUST ser concluídas e a listagem atualizada sem elas; enviar sem marcar nenhuma apenas atualiza a listagem. Pelo comando, tarefa já concluída ou inexistente MUST resultar em `Tarefa não encontrada.`

#### Scenario: Concluir várias pelo formulário

- **WHEN** o usuário clica "☑️ Marcar concluídas", marca as tarefas 5 e 7 e envia
- **THEN** as tarefas 5 e 7 passam a concluídas e a listagem é atualizada sem elas

#### Scenario: Tarefa concluída por outro meio antes do envio

- **WHEN** o usuário marca no formulário uma tarefa que já foi concluída por `/tarefa concluir` antes do envio
- **THEN** essa tarefa é ignorada, as demais marcadas são concluídas e a listagem é atualizada

#### Scenario: Concluir pelo comando

- **WHEN** o usuário executa `/tarefa concluir id:12` para uma tarefa pendente sua
- **THEN** a tarefa é concluída e o usuário recebe confirmação efêmera

### Requirement: Sugestões ao concluir por comando

A opção `id` de `/tarefa concluir` SHALL oferecer sugestões automáticas com as tarefas pendentes do próprio usuário, no formato `🔲 texto`, filtradas por trecho do texto digitado, até 25 sugestões; o id fica oculto como valor da sugestão. A opção `id` de `/tarefa remover` SHALL oferecer as mesmas sugestões incluindo as concluídas (`☑️ texto`), pendentes primeiro. Tarefas de outros usuários MUST NOT aparecer, e em `/tarefa concluir` as concluídas MUST NOT aparecer. Os ids MUST NOT ser exibidos nas listagens nem no formulário.

#### Scenario: Buscar pelo texto

- **WHEN** o usuário digita `rev` na opção `id` de `/tarefa concluir`
- **THEN** vê sugestões como `🔲 Revisar PR` e, ao escolher, o comando recebe o id dessa tarefa

### Requirement: Remover tarefa

O comando `/tarefa remover id:<n>` SHALL excluir definitivamente uma tarefa do usuário, pendente ou concluída. Tarefa inexistente ou de outra pessoa MUST resultar em `Tarefa não encontrada.`

#### Scenario: Remover

- **WHEN** o usuário remove uma tarefa sua
- **THEN** ela não aparece mais em nenhuma listagem

### Requirement: Listar tarefas concluídas

O comando `/tarefa concluidas` SHALL responder de forma efêmera com as 10 tarefas concluídas mais recentes do usuário, no formato `- ☑️ texto` (emoji `:ballot_box_with_check:`). Sem concluídas, MUST responder `Você não tem tarefas concluídas.`

#### Scenario: Concluídas recentes

- **WHEN** um usuário com 15 tarefas concluídas executa `/tarefa concluidas`
- **THEN** vê as 10 concluídas mais recentemente
