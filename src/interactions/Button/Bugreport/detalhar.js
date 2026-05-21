const axios = require("axios");
const logger = require("../../../utils/logger");

const N8N_WEBHOOK_URL = process.env.N8N_BUGREPORT_WEBHOOK_URL;

module.exports = {
  data: {
    name: "detalhar|",
    startsWith: true,
  },
  execute: async (interaction) => {
    await interaction.deferReply();

    const customId = interaction.customId;
    const parts = customId.split("|");
    const bugReportId = parts[1] ?? "";

    if (!N8N_WEBHOOK_URL) {
      logger.error("N8N_BUGREPORT_WEBHOOK_URL não configurada.");
      return await interaction.editReply({
        content: "❌ Webhook do n8n não configurado.",
      });
    }

    try {
      const response = await axios.post(N8N_WEBHOOK_URL, {
        bugReportId
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
        content: "❌ Erro ao consultar a IA. Tente novamente.",
      });
    }
  },
};

function splitMessage(text, maxLength) {
  const chunks = [];
  while (text.length > 0) {
    chunks.push(text.slice(0, maxLength));
    text = text.slice(maxLength);
  }
  return chunks;
}