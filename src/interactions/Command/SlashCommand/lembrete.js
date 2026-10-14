const { SlashCommandBuilder, InteractionContextType } = require("discord.js");

const ReminderController = require("../../../controllers/reminder");
const {
  RECORRENCIAS,
  FORMATOS_AJUDA,
  formatar,
} = require("../../../utils/quando");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lembrete")
    .setDescription("Gerenciar lembretes")
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) =>
      sub
        .setName("criar")
        .setDescription("Agendar um lembrete")
        .addStringOption((option) =>
          option
            .setName("texto")
            .setDescription("O que lembrar")
            .setMaxLength(500)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("quando")
            .setDescription(
              "HH:mm, dd/MM HH:mm, dd/MM/yyyy HH:mm ou relativo (30m, 2h, 1d)",
            )
            .setRequired(true),
        )
        .addUserOption((option) =>
          option
            .setName("para")
            .setDescription("Membro do servidor a ser lembrado (padrão: você)"),
        )
        .addStringOption((option) =>
          option
            .setName("repetir")
            .setDescription("Repetir o lembrete")
            .addChoices(
              ...Object.entries(RECORRENCIAS).map(([value, name]) => ({
                name,
                value,
              })),
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("listar").setDescription("Listar seus lembretes ativos"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("descartar")
        .setDescription("Descartar um lembrete ativo")
        .addIntegerOption((option) =>
          option
            .setName("id")
            .setDescription("Id do lembrete")
            .setMinValue(1)
            .setRequired(true),
        ),
    ),
  execute: async (interaction) => {
    const sub = interaction.options.getSubcommand();

    if (sub === "criar") {
      const para = interaction.options.getUser("para");
      if (para && para.bot) {
        return interaction.reply({
          content: "Não é possível criar lembretes para bots.",
          ephemeral: true,
        });
      }
      if (para && !interaction.options.getMember("para")) {
        return interaction.reply({
          content: "Esse usuário não é membro deste servidor.",
          ephemeral: true,
        });
      }

      const { erro, lembrete } = await ReminderController.criar({
        criador_id: interaction.user.id,
        destinatario_id: (para || interaction.user).id,
        guild_id: interaction.guildId,
        channel_id: interaction.channelId,
        texto: interaction.options.getString("texto"),
        quando: interaction.options.getString("quando"),
        recorrencia: interaction.options.getString("repetir"),
      });

      if (erro === "invalido") {
        return interaction.reply({
          content: `Data/hora inválida ou no passado. ${FORMATOS_AJUDA}`,
          ephemeral: true,
        });
      }
      if (erro === "limite") {
        return interaction.reply({
          content: `Você atingiu o limite de ${ReminderController.LIMITE_ATIVOS} lembretes ativos. Descarte algum para criar outro.`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `Lembrete #${lembrete.id} agendado para ${formatar(
          lembrete.datahora,
        )}.`,
        ephemeral: true,
      });
    }

    if (sub === "listar") {
      const lembretes = await ReminderController.listar(interaction.user.id);
      if (!lembretes.length) {
        return interaction.reply({
          content: "Você não tem lembretes ativos.",
          ephemeral: true,
        });
      }
      return interaction.reply({
        embeds: [
          ReminderController.montarListagem(lembretes, interaction.user.id),
        ],
        ephemeral: true,
      });
    }

    if (sub === "descartar") {
      const id = interaction.options.getInteger("id");
      const ok = await ReminderController.descartar(id, interaction.user.id);
      return interaction.reply({
        content: ok
          ? `Lembrete #${id} descartado.`
          : "Lembrete não encontrado.",
        ephemeral: true,
      });
    }
  },
};
