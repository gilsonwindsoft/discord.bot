const Away = require("./models/ausencia");
const { DateTime } = require("luxon");
const { EmbedBuilder } = require("discord.js");

var cron = require('node-cron');

function startJobs(client) {
    // notifica o usuário do discord quando há um timer ativo a mais de 5 minutos
    // apenas das 7 as 19 horas e nos dias da semana
    cron.schedule('*/5 7-19 * * 1-5', () => {
      notificarTimersAtivos(client);
    });
}

async function notificarTimersAtivos(client) {
  // notifica o usuário do discord quando há um timer ativo a mais de 5 minutos
  console.log('notificando timers ativos');
  const timersAtivos = await listarTimersAtivos();
  timersAtivos.forEach( async (timer) => {
      const segundos = Math.floor((new Date().getTime() - timer.datahora_inicio) / 1000);
      if (segundos > 600) {
        // envia a notificação para o usuário
        const embed = new EmbedBuilder();
        embed.setTitle("Você tem um timer ativo a mais de 10 minutos!");
        embed.setDescription(timer.descricao);
        embed.setFooter({text: `Timer iniciado em ${DateTime.fromJSDate(timer.datahora_inicio).setZone("America/Sao_Paulo").toFormat("dd/MM/yyyy HH:mm:ss")}`});
        embed.setColor("#0099ff");

        try {
          let user = await client.users.cache.get(timer.usuario);
          if (!user) {
            user = await client.users.fetch(timer.usuario);
          }
          if (user) {
            await user.send({ embeds: [embed] }).catch(error => {
              console.error(`Não foi possível enviar mensagem para ${user.tag} devido a: ${error}`);
            });
          }        
        } catch (error) {
                console.error(error);
        }
      }  
    });
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

exports.startJobs = startJobs;