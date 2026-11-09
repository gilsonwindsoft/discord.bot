const { Interval, DateTime } = require("luxon");
const humanizeDuration = require("humanize-duration");
const Away = require("../models/ausencia");
const { EmbedBuilder } = require("discord.js");
const { Op } = require("sequelize");
const logger = require("../utils/logger");

const AWAY_ROLE_NAME = "Ausente";
const AWAY_DESCRIPTION = "Ausente";
const LUNCH_DESCRIPTION = "Almoço";

const types = {
  AWAY_START: {
    title: "Ausência",
    color: "#F1C40F",
  },
  AWAY_FINISH: {
    title: "Ausência finalizada",
    color: "#57F287",
  },

  LUNCH_START: {
    title: "Almoço",
    color: "#E67E22",
  },
  LUNCH_FINISH: {
    title: "Almoço finalizado",
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
};

module.exports = {
  LUNCH_DESCRIPTION,
  start: async (usuario, motivo, channel_id) => {
    const away = await Away.create({
      usuario,
      descricao: motivo,
      channel_id,
      datahora_inicio: new Date(),
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
    result.duracao_segundos = Math.floor(
      (new Date().getTime() - result.datahora_inicio) / 1000,
    );

    await result.save();
    return result;
  },

  // Never throws: role failures must not block the absence flow.
  setAwayRole: async (client, away, ausente) => {
    try {
      // Ausência e almoço compartilham o cargo: só remove se nenhum dos dois segue aberto.
      if (!ausente) {
        const outrosAbertos = await Away.count({
          where: {
            usuario: away.usuario,
            datahora_fim: null,
            descricao: { [Op.in]: [AWAY_DESCRIPTION, LUNCH_DESCRIPTION] },
            id: { [Op.ne]: away.id },
          },
        });
        if (outrosAbertos) return;
      }

      const guild = client.channels.cache.get(away.channel_id)?.guild;
      if (!guild) {
        logger.warn(
          `Cargo ${AWAY_ROLE_NAME}: servidor do canal ${away.channel_id} não encontrado.`,
        );
        return;
      }

      let role = guild.roles.cache.find((r) => r.name === AWAY_ROLE_NAME);
      if (!role) {
        if (!ausente) return;
        role = await guild.roles.create({
          name: AWAY_ROLE_NAME,
          color: "#F1C40F",
          hoist: true,
          mentionable: false,
          permissions: [],
        });
      }

      const options = { user: away.usuario, role };
      if (ausente) await guild.members.addRole(options);
      else await guild.members.removeRole(options);
    } catch (e) {
      logger.error(
        `Cargo ${AWAY_ROLE_NAME} do usuário ${away.usuario} (${
          ausente ? "adicionar" : "remover"
        }) falhou:`,
        e,
      );
    }
  },

  buildMessage: (
    type,
    globalName,
    avatarUrl,
    descricao,
    datahora_inicio,
    datahora_fim,
    duracao_segundos,
  ) => {
    const fields = [];

    const embed = new EmbedBuilder()
      .setAuthor({ name: globalName, iconURL: avatarUrl })
      .setTitle(types[type].title)
      .setColor(types[type].color)
      .setTimestamp(new Date());

    fields.push({
      name: "Início",
      value:
        "```lua\n" +
        DateTime.fromJSDate(datahora_inicio)
          .setZone("America/Sao_Paulo")
          .toFormat("dd/MM/yyyy HH:mm:ss") +
        "\n```",
      inline: true,
    });

    if (datahora_fim) {
      let duracao = Interval;
      duracao = duracao_segundos * 1000;
      fields.push({
        name: "Fim",
        value:
          "```lua\n" +
          DateTime.fromJSDate(datahora_fim)
            .setZone("America/Sao_Paulo")
            .toFormat("dd/MM/yyyy HH:mm:ss") +
          "\n```",
        inline: true,
      });
      fields.push({
        name: "Duração",
        value:
          "```lua\n" + humanizeDuration(duracao, { language: "pt" }) + "\n```",
      });
    }

    fields.push({ name: "Descrição", value: "```" + descricao + "```" });

    embed.setFields(fields);

    return embed;
  },
};
