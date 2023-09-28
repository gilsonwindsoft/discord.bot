const { SlashCommandBuilder } = require("discord.js");
const Away = require("../../../models/ausencia");
const TimerController = require("../../../controllers/timer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("retornar")
    .setDescription("Retornar de uma ausência"),
  execute: async (interaction) => {
    const result = await Away.findOne({
      where: {
        usuario: interaction.user.id,
        descricao: "Ausente",
        datahora_fim: null,
      },
    });

    if (!result) {
      await interaction.reply({
        content: "Você não está ausente.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content:
        "> <a:loading:1152363442414571560> **|** Aguarde, estamos registrando seu retorno...",
      ephemeral: true,
    });

    const finalTimer = await TimerController.stop(result.id);

    const embed = TimerController.buildMessage(
      "AWAY_FINISH",
      interaction.user.globalName,
      interaction.user.avatarURL(),
      finalTimer.descricao,
      finalTimer.datahora_inicio,
      finalTimer.datahora_fim,
      finalTimer.duracao_segundos,
    );

    await interaction.client.channels.cache
      .get(finalTimer.channel_id)
      .send({ embeds: [embed] });

    await interaction.editReply({
      content: "Você retornou ao trabalho.",
      ephemeral: true,
    });
  },
};
