const { Duration, DateTime } = require("luxon");
const Away = require("../models/ausencia");
const { EmbedBuilder } = require("discord.js");

const types = {
	AWAY_START: {
		title: "Ausência",
		color: "#F1C40F",
	},
	AWAY_FINISH: {
		title: "Ausência finalizada",
		color: "#57F287",
	},

	TIMER_START: {
		title: "Timer iniciado",
		color: "#3498DB",
	},
	TIMER_FINISH: {
		title: "Timer finalizado",
		color: "#57F287",
	},
}

module.exports = {
	start: async (usuario, motivo, channel_id) => {
		const away = await Away.create({
			usuario,
			descricao: motivo,
			channel_id,
		});
		return away;
	},
	stop: async (id) => {
		const result = await Away.findOne({
			where: {
				id,
			},
		});

		result.datahora_fim = new Date();
		result.duracao_segundos = Math.floor((new Date().getTime() - result.datahora_inicio) / 1000);

		await result.save();
		return result;
	},

	buildMessage: (type, globalName, avatarUrl, descricao, datahora_inicio, datahora_fim, duracao_segundos) => {
		const fields = [];

		const embed = new EmbedBuilder()
			.setAuthor({ name: globalName, iconURL: avatarUrl })
			.setTitle(types[type].title)
			.setColor(types[type].color)
			.setTimestamp(new Date())
		
		fields.push({ name: "Início", value: "```lua\n" + DateTime.fromJSDate(datahora_inicio).toFormat("dd/MM/yyyy HH:mm:ss") + "\n```", inline: true });

		const Interval = luxon.Interval;
		
		const formatted = Interval
			.fromDateTimes(datahora_inicio, datahora_fim)
			.toDuration()
			.valueOf();
		
		if (datahora_fim) {
			fields.push({ name: "Fim", value: "```lua\n" + DateTime.fromJSDate(datahora_fim).toFormat("dd/MM/yyyy HH:mm:ss") + "\n```", inline: true });
			fields.push({ name: "Duração", value: "```lua\n" + humanizeDuration(formatted, { language: 'pt' })});
			fields.push({ name: "Descrição" , value: "```" + descricao + "```" });
		}

		embed.setFields(fields);

		return embed;
	}
}
