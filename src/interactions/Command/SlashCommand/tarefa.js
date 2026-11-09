const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

const TaskController = require("../../../controllers/task");
const SummaryController = require("../../../controllers/summary");
const { parseChecklist } = require("../../../utils/checklist");
const { HORARIOS_PADRAO, validaHorario } = require("../../../utils/quando");

const MODAL_TIMEOUT_MS = 10 * 60 * 1000;

const idOption = (option) =>
  option
    .setName("id")
    .setDescription("Id da tarefa")
    .setMinValue(1)
    .setRequired(true);

async function adicionar(interaction) {
  const customId = `tarefa-adicionar-${interaction.id}`;
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle("Adicionar tarefas")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("tarefas")
          .setLabel("Uma tarefa por linha: - [ ] ou - [x]")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("- [ ] Revisar PR\n- [x] Atualizar dependências")
          .setMaxLength(4000)
          .setRequired(true),
      ),
    );

  await interaction.showModal(modal);

  let submit;
  try {
    submit = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === customId,
      time: MODAL_TIMEOUT_MS,
    });
  } catch {
    return; // modal fechado ou expirado
  }

  const { erro, tarefas } = parseChecklist(
    submit.fields.getTextInputValue("tarefas"),
  );
  if (erro) {
    return submit.reply({
      content: `${erro} Nenhuma tarefa foi adicionada.`,
      ephemeral: true,
    });
  }

  await TaskController.adicionar(interaction.user.id, tarefas);
  const concluidas = tarefas.filter((t) => t.concluida).length;
  await submit.reply({
    content: `${
      tarefas.length - concluidas
    } tarefa(s) pendente(s) e ${concluidas} concluída(s) adicionadas.`,
    ephemeral: true,
  });
}

async function lembretes(interaction) {
  const usuario_id = interaction.user.id;
  const posicao = interaction.options.getInteger("horario");
  const horario = interaction.options.getString("hora")?.trim() ?? null;
  const ativo = interaction.options.getBoolean("ativo");
  const altera = horario !== null || ativo !== null;

  if (altera && posicao === null) {
    return interaction.reply({
      content: "Informe qual horário alterar na opção `horario`.",
      ephemeral: true,
    });
  }
  if (horario !== null && !validaHorario(horario)) {
    return interaction.reply({
      content: "Horário inválido. Use `HH:mm`, entre 00:00 e 23:59.",
      ephemeral: true,
    });
  }

  if (altera) {
    await SummaryController.configurarHorario(usuario_id, posicao, {
      horario,
      ativo,
    });
  }

  return interaction.reply({
    embeds: [await SummaryController.montarConfiguracao(usuario_id)],
    ephemeral: true,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tarefa")
    .setDescription("Gerenciar suas tarefas")
    .addSubcommand((sub) =>
      sub
        .setName("adicionar")
        .setDescription("Adicionar tarefas com checklist markdown"),
    )
    .addSubcommand((sub) =>
      sub.setName("listar").setDescription("Listar suas tarefas pendentes"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("concluir")
        .setDescription("Concluir uma tarefa")
        .addIntegerOption((option) => idOption(option).setAutocomplete(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remover")
        .setDescription("Remover uma tarefa")
        .addIntegerOption((option) => idOption(option).setAutocomplete(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("concluidas")
        .setDescription("Listar suas tarefas concluídas recentemente"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("lembretes")
        .setDescription("Ver ou configurar os horários do resumo de pendências")
        .addIntegerOption((option) =>
          option
            .setName("horario")
            .setDescription("Qual horário alterar")
            .addChoices(
              ...HORARIOS_PADRAO.map((h) => ({
                name: h.nome,
                value: h.posicao,
              })),
            ),
        )
        .addStringOption((option) =>
          option
            .setName("hora")
            .setDescription("Novo horário no formato HH:mm")
            .setMaxLength(5),
        )
        .addBooleanOption((option) =>
          option
            .setName("ativo")
            .setDescription("Ativar ou desativar o horário"),
        ),
    ),
  autocomplete: async (interaction) => {
    await interaction.respond(
      await TaskController.sugerir(
        interaction.user.id,
        interaction.options.getFocused(),
        interaction.options.getSubcommand() === "remover",
      ),
    );
  },
  execute: async (interaction) => {
    const sub = interaction.options.getSubcommand();
    const usuario_id = interaction.user.id;

    if (sub === "adicionar") return adicionar(interaction);
    if (sub === "lembretes") return lembretes(interaction);

    if (sub === "listar") {
      return interaction.reply({
        ...(await TaskController.montarPendentes(usuario_id)),
        ephemeral: true,
      });
    }

    if (sub === "concluidas") {
      return interaction.reply({
        ...(await TaskController.montarConcluidas(usuario_id)),
        ephemeral: true,
      });
    }

    const id = interaction.options.getInteger("id");
    const ok =
      sub === "concluir"
        ? await TaskController.concluir(id, usuario_id)
        : await TaskController.remover(id, usuario_id);

    return interaction.reply({
      content: ok
        ? `Tarefa ${sub === "concluir" ? "concluída" : "removida"}.`
        : "Tarefa não encontrada.",
      ephemeral: true,
    });
  },
};
