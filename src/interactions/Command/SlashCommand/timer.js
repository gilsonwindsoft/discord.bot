const { EmbedBuilder } = require("discord.js");
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder } = require("discord.js");
const { DateTime } = require("luxon");

const Away = require("../../../models/ausencia");
const TimerController = require("../../../controllers/timer");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("timer")
		.setDescription("Iniciar um timer")
		.addStringOption((option) => 
			option
				.setName("descrição")
				.setDescription("Descrição/motivo do timer")
				.setRequired(true)
		),
	execute: async (interaction) => {
		const descricao = interaction.options.getString("descrição");

		const result = await Away.findOne({
			where: {
				usuario: interaction.user.id,
				descricao,
				datahora_fim: null,
			},
		});

		if (result) {
			await interaction.reply({ content: "> <a:loading:1152363442414571560> **|** Aguarde, estamos encerrando seu timer...", ephemeral: true });

			const finalTimer = await TimerController.stop(result.id);

			const embed = TimerController.buildMessage("TIMER_FINISH", interaction.user.globalName, interaction.user.avatarURL(), finalTimer.descricao, finalTimer.datahora_inicio, finalTimer.datahora_fim, finalTimer.duracao_segundos);
			await interaction.client.channels.cache.get(finalTimer.channel_id).send({ embeds: [ embed ] });

			await interaction.editReply({ content: "Timer finalizado.", ephemeral: true });
			return;
		}

		await interaction.reply({ content: "> <a:loading:1152363442414571560> **|** Aguarde enquanto iniciamos seu timer...", ephemeral: true });

		const timer = await TimerController.start(interaction.user.id, descricao, interaction.channel.id);

		// Enviar mensagem com botão
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("timer-finalizar-" + timer.id)
					.setLabel("Finalizar")
					.setStyle(ButtonStyle.Primary),
		);
		
		const embed = TimerController.buildMessage("TIMER_START", interaction.user.globalName, interaction.user.avatarURL(), timer.descricao, timer.datahora_inicio, null, null);
		
		await interaction.channel.send({ embeds: [ embed ] });
		await interaction.editReply({ content: "Você iniciou um timer, clique no botão abaixo para finalizá-lo.", components: [row] });
	},
};
