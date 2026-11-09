const { SlashCommandBuilder } = require("discord.js");
const Away = require("../../../models/ausencia");
const TimerController = require("../../../controllers/timer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("offrango")
    .setDescription("Voltar do almoço"),
  execute: async (interaction) => {
    const result = await Away.findOne({
      where: {
        usuario: interaction.user.id,
        descricao: TimerController.LUNCH_DESCRIPTION,
        datahora_fim: null,
      },
    });

    if (!result) {
      await interaction.reply({
        content: "Você não está no almoço.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content:
        "> <a:loading:1152363442414571560> **|** Aguarde, estamos registrando seu retorno...",
      ephemeral: true,
    });

    const finalLunch = await TimerController.stop(result.id);
    await TimerController.setAwayRole(interaction.client, finalLunch, false);

    const embed = TimerController.buildMessage(
      "LUNCH_FINISH",
      interaction.user.globalName,
      interaction.user.avatarURL(),
      finalLunch.descricao,
      finalLunch.datahora_inicio,
      finalLunch.datahora_fim,
      finalLunch.duracao_segundos,
    );

    await interaction.client.channels.cache
      .get(finalLunch.channel_id)
      .send({ embeds: [embed] });

    await interaction.editReply({
      content: "Você voltou do almoço.",
    });
  },
};
