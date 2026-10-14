const ReminderController = require("../../../controllers/reminder");
const { formatar } = require("../../../utils/quando");

module.exports = {
  data: {
    name: "lembrete-adiar-",
    startsWith: true,
  },
  execute: async (interaction) => {
    const id = Number(interaction.customId.replace("lembrete-adiar-", ""));
    const lembrete = await ReminderController.buscarDoDestinatario(
      id,
      interaction.user.id,
    );

    if (!lembrete) {
      return interaction.reply({
        content: "Apenas o destinatário pode usar este lembrete.",
        ephemeral: true,
      });
    }

    // Entregue pode ser adiado; descartado não volta a ficar ativo.
    if (lembrete.status === "descartado") {
      return interaction.update({
        content: "Este lembrete foi descartado.",
        components: [],
        allowedMentions: { parse: [] },
      });
    }

    const novo = await ReminderController.adiar(lembrete);

    await interaction.update({
      content: `⏰ Adiado para ${formatar(novo.datahora)} (lembrete #${
        novo.id
      }).`,
      components: [],
      allowedMentions: { parse: [] },
    });
  },
};
