const { EmbedBuilder } = require("discord.js");
const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  SlashCommandBuilder,
} = require("discord.js");
const { DateTime } = require("luxon");

const Away = require("../../../models/ausencia");
const TimerController = require("../../../controllers/timer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ausente")
    .setDescription("Ficar ausente por um tempo"),
  execute: async (interaction) => {
    // interaction.client.users.fetch(interaction.user.id, false).then((user) => {
    // 	user.send('hello world');
    // });

    // await interaction.reply({ content: "Comando de compra iniciado", ephemeral: true });
    // await interaction.reply({ content: "Comando de compra iniciado" });
    // await interaction.reply("Comando de compra iniciado");

    const result = await Away.findOne({
      where: {
        usuario: interaction.user.id,
        descricao: "Ausente",
        datahora_fim: null,
      },
    });

    if (result) {
      await interaction.reply({
        content:
          "Você já está ausente, clique no botão abaixo para retornar ao trabalho.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content:
        "> <a:loading:1152363442414571560> **|** Aguarde, estamos registrando sua ausência...",
      ephemeral: true,
    });

    const timer = await TimerController.start(
      interaction.user.id,
      "Ausente",
      interaction.channel.id,
    );

    // Enviar mensagem com botão
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ausente-retornar-" + timer.id)
        .setLabel("Retornar")
        .setStyle(ButtonStyle.Primary),
    );

    const embed = TimerController.buildMessage(
      "AWAY_START",
      interaction.user.globalName,
      interaction.user.avatarURL(),
      timer.descricao,
      timer.datahora_inicio,
      null,
      null,
    );

    await interaction.channel.send({ embeds: [embed] });
    await interaction.editReply({
      content:
        "Você está ausente, clique no botão abaixo para retornar ao trabalho.",
      components: [row],
    });
  },
};
