const Away = require("../../../models/ausencia");
const TimerController = require("../../../controllers/timer");

module.exports = {
  data: {
    name: "rango-voltei-",
    startsWith: true,
  },
  execute: async (interaction) => {
    const lunch = await Away.findOne({
      where: {
        usuario: interaction.user.id,
        descricao: TimerController.LUNCH_DESCRIPTION,
        datahora_fim: null,
      },
    });

    if (!lunch) {
      return await interaction.update({
        content: "Você não está no almoço.",
        components: [],
      });
    }

    const finalLunch = await TimerController.stop(lunch.id);
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
    await interaction.channel.send({ embeds: [embed] });

    await interaction.update({
      content: "Bom retorno, você voltou do almoço!",
      components: [],
    });
  },
};
