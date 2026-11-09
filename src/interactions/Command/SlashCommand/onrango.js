const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  SlashCommandBuilder,
} = require("discord.js");

const Away = require("../../../models/ausencia");
const TimerController = require("../../../controllers/timer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("onrango")
    .setDescription("Sair para o almoço"),
  execute: async (interaction) => {
    const result = await Away.findOne({
      where: {
        usuario: interaction.user.id,
        descricao: TimerController.LUNCH_DESCRIPTION,
        datahora_fim: null,
      },
    });

    if (result) {
      await interaction.reply({
        content:
          "Você já está no almoço, use /offrango ou o botão **Voltei** para retornar.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content:
        "> <a:loading:1152363442414571560> **|** Aguarde, estamos registrando seu almoço...",
      ephemeral: true,
    });

    const lunch = await TimerController.start(
      interaction.user.id,
      TimerController.LUNCH_DESCRIPTION,
      interaction.channel.id,
    );
    await TimerController.setAwayRole(interaction.client, lunch, true);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rango-voltei-" + lunch.id)
        .setLabel("Voltei")
        .setStyle(ButtonStyle.Primary),
    );

    const embed = TimerController.buildMessage(
      "LUNCH_START",
      interaction.user.globalName,
      interaction.user.avatarURL(),
      lunch.descricao,
      lunch.datahora_inicio,
      null,
      null,
    );

    await interaction.channel.send({ embeds: [embed] });
    await interaction.editReply({
      content: "Bom rango! Clique em **Voltei** quando retornar.",
      components: [row],
    });
  },
};
