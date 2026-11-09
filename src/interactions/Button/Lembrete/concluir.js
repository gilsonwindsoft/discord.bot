const ReminderController = require("../../../controllers/reminder");

module.exports = {
  data: {
    name: "lembrete-concluir-",
    startsWith: true,
  },
  execute: async (interaction) => {
    const id = Number(interaction.customId.replace("lembrete-concluir-", ""));
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

    // Recorrente não muda: continua ativo para a próxima ocorrência.
    await ReminderController.concluirPassados(lembrete.id, interaction.user.id);

    await interaction.update({
      content: "✅ Concluído.",
      components: [],
      allowedMentions: { parse: [] },
    });
  },
};
