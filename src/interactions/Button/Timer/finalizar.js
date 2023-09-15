const Away = require("../../../models/ausencia");
const TimerController = require("../../../controllers/timer");
const { Op } = require("sequelize");

module.exports = {
	data: {
		name: `timer-finalizar-`,
		startsWith: true,
	},
	execute: async (interaction) => {
		const away = await Away.findOne({
			where: {
				usuario: interaction.user.id,
				descricao: {
					[Op.not]: "Ausente"
				},
				datahora_fim: null,
			}
		});

		if (!away) {
			return await interaction.update({ content: "Você não possui timers.", components: [] });
		}

		const finalTimer = await TimerController.stop(away.id);

		const embed = TimerController.buildMessage("TIMER_FINISH", interaction.user.globalName, interaction.user.avatarURL(), finalTimer.descricao, finalTimer.datahora_inicio, finalTimer.datahora_fim, finalTimer.duracao_segundos);
		await interaction.channel.send({ embeds: [ embed ] });

		await interaction.update({ content: "Seu timer foi finalizado!", components: [] });
	},
};
