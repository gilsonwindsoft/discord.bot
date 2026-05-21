const axios = require("axios");
const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const logger = require("../../../utils/logger");

const N8N_WEBHOOK_URL = process.env.N8N_BUGREPORT_WEBHOOK_URL;
const processingDetails = new Set();

module.exports = {
  data: {
    name: "detalhar|",
    startsWith: true,
  },
  execute: async (interaction) => {
    const customId = interaction.customId;
    const parts = customId.split("|");
    const bugReportId = parts[1] ?? "";
    const processingKey = `${interaction.message.id}:${customId}`;

    if (!N8N_WEBHOOK_URL) {
      logger.error("N8N_BUGREPORT_WEBHOOK_URL não configurada.");
      return await interaction.reply({
        content: "❌ Webhook do n8n não configurado.",
        ephemeral: true,
      });
    }

    if (processingDetails.has(processingKey)) {
      return await interaction.reply({
        content: "Esse bugreport já está sendo detalhado.",
        ephemeral: true,
      });
    }

    processingDetails.add(processingKey);

    await interaction.deferReply();
    await disableClickedButton(interaction);

    try {
      const response = await axios.post(N8N_WEBHOOK_URL, {
        bugReportId,
      });

      const text = response.data?.output?.[0]?.content?.[0]?.text;

      if (!text) {
        return await interaction.editReply({
          content: "⚠️ A IA não retornou uma análise.",
        });
      }

      const chunks = splitMessage(text, 2000);

      await interaction.editReply({ content: chunks[0] });

      for (let i = 1; i < chunks.length; i++) {
        await interaction.followUp({ content: chunks[i] });
      }
    } catch (error) {
      logger.error(error);
      await interaction.editReply({
        content: "❌ Erro ao consultar a IA.",
      });
    }
  },
};

async function disableClickedButton(interaction) {
  const components = interaction.message.components.map((row) => {
    const actionRow = ActionRowBuilder.from(row);

    actionRow.setComponents(
      row.components.map((component) => {
        const button = ButtonBuilder.from(component);

        if (component.customId === interaction.customId) {
          button.setDisabled(true);
        }

        return button;
      }),
    );

    return actionRow;
  });

  await interaction.message.edit({ components }).catch((error) => {
    logger.error(error);
  });
}

function splitMessage(text, maxLength) {
  const chunks = [];
  while (text.length > 0) {
    chunks.push(text.slice(0, maxLength));
    text = text.slice(maxLength);
  }
  return chunks;
}
