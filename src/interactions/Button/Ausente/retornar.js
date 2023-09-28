const Away = require("../../../models/ausencia");
const TimerController = require("../../../controllers/timer");

module.exports = {
  data: {
    name: `ausente-retornar-`,
    startsWith: true,
  },
  execute: async (interaction) => {
    const away = await Away.findOne({
      where: {
        usuario: interaction.user.id,
        descricao: "Ausente",
        datahora_fim: null,
      },
    });

    if (!away) {
      return await interaction.update({
        content: "Você não está ausente.",
        components: [],
      });
    }

    const finalTimer = await TimerController.stop(away.id);

    const embed = TimerController.buildMessage(
      "AWAY_FINISH",
      interaction.user.globalName,
      interaction.user.avatarURL(),
      finalTimer.descricao,
      finalTimer.datahora_inicio,
      finalTimer.datahora_fim,
      finalTimer.duracao_segundos,
    );
    await interaction.channel.send({ embeds: [embed] });

    await interaction.update({
      content: "Boa, você retornou ao trabalho!",
      components: [],
    });
  },
};
