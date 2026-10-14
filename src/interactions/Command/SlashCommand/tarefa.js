const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

const TaskController = require("../../../controllers/task");
const { parseChecklist } = require("../../../utils/checklist");

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
