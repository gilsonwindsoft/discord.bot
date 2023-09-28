const Away = require("./models/ausencia");
const { Op } = require("sequelize");
const { sequelize } = require("./database");
const { Interval, DateTime } = require("luxon");
const { EmbedBuilder } = require("discord.js");
const humanizeDuration = require("humanize-duration");
const adminID = '429815677528834048';

var cron = require("node-cron");

exports.startJobs = startJobs;

function startJobs(client) {
  // notifica o usuário do discord quando há um timer ativo a mais de 5 minutos
  // apenas das 7 as 19 horas e nos dias da semana
  cron.schedule("*/5 7-19 * * 1-5", () => {
    notificarTimersAtivos(client);
  });

  // notifica o usuário do discord todos os dias as 18:30 com o total de tempo dos timers do dia
  cron.schedule("30 18 * * 1-5", () => {
    notificarTimersDoDia(client);
  });
}

async function notificarTimersDoDia(client) {
  // notifica o usuário do discord todos os dias as 18:30 com o total de tempo dos timers do dia
  console.log("notificando timers do dia");
  const timersDoDia = await listarTimersDoDia();
  timersDoDia.forEach(async (timer) => {
    // envia a notificação para o usuário
    try {
      const user = await getDiscordUserByID(client, timer.usuario);
      if (user) {
        const fields = [];
        let duracao = Interval;
        duracao = timer.total_duracao_segundos * 1000;

        const embed = new EmbedBuilder()
          .setTitle(`*Timers do dia:* ${user.globalName}`)
          .setDescription(timer.descricao)
          .setColor("#0099ff")
          .setTimestamp(new Date());

        fields.push({
          name: "Duração",
          value: "```lua\n" + humanizeDuration(duracao, { language: "pt" }) + "\n```",
        });

        fields.push({ 
          name: "Descrição", 
          value: "```" + timer.descricao + "```" 
        });

        embed.setFields(fields);

        await user.send({ embeds: [embed] }).catch(error => {
          console.error(`Não foi possível enviar mensagem para ${user.tag} devido a: ${error}`);
        });

        const admin = await getDiscordUserByID(client, adminID);
        if (admin) {
          await admin.send({ embeds: [embed] }).catch(error => {
            console.error(`Não foi possível enviar mensagem para ${admin.tag} devido a: ${error}`);
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
}

async function notificarTimersAtivos(client) {
  // notifica o usuário do discord quando há um timer ativo a mais de 5 minutos
  console.log("notificando timers ativos");
  const timersAtivos = await listarTimersAtivos();
  timersAtivos.forEach(async (timer) => {
    const segundos = Math.floor(
      (new Date().getTime() - timer.datahora_inicio) / 1000,
    );
    if (segundos > 600) {
      // envia a notificação para o usuário
      const embed = new EmbedBuilder();
      embed.setTitle("Você tem um timer ativo a mais de 10 minutos!");
      embed.setDescription(timer.descricao);
      embed.setFooter({
        text: `Timer iniciado em ${DateTime.fromJSDate(timer.datahora_inicio)
          .setZone("America/Sao_Paulo")
          .toFormat("dd/MM/yyyy HH:mm:ss")}`,
      });
      embed.setColor("#0099ff");

      try {
        const user = await getDiscordUserByID(client, timer.usuario);
        if (user) {
          await user.send({ embeds: [embed] }).catch((error) => {
            console.error(
              `Não foi possível enviar mensagem para ${user.tag} devido a: ${error}`,
            );
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
  });
}

async function getDiscordUserByID(client, id) {
  try {
    let user = await client.users.cache.get(id);
    if (!user) {
      user = await client.users.fetch(id);
    }

    return user;
  } catch (error) {
    console.error(error);
  }
}

async function listarTimersAtivos() {
  // busca por timers ativos
  const timersAtivos = await Away.findAll({
    where: {
      datahora_fim: null,
    },
  });
  return timersAtivos;
}

async function listarTimersDoDia() {
  // busca por timers ativos
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const result = await Away.findAll({
      attributes: [
        "usuario",
        "descricao",
        [
          sequelize.fn("sum", sequelize.col("duracao_segundos")),
          "total_duracao_segundos",
        ],
      ],
      where: {
        datahora_fim: {
          [Op.gte]: todayStart,
          [Op.lte]: todayEnd,
        },
      },
      group: ["usuario","descricao"],
      raw: true, // para obter um output mais limpo
    });

    return result;
  } catch (error) {
    console.error("Erro ao buscar os dados:", error);
    throw error;
  }
}
