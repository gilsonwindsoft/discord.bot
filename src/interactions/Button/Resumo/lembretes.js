const TaskController = require("../../../controllers/task");
const ReminderController = require("../../../controllers/reminder");
const SummaryController = require("../../../controllers/summary");
const { formatar } = require("../../../utils/quando");

module.exports = {
  data: {
    name: "resumo-lembretes-concluir",
  },
  execute: async (interaction) => {
    const usuario_id = interaction.user.id;
    const { exibidos } = await SummaryController.lembretesExibidos(usuario_id);

    if (!exibidos.length) {
      return interaction.update(
        await SummaryController.montarAtualizacao(usuario_id),
      );
    }

    const customId = `resumo-lembretes-concluir-${interaction.id}`;
    const resultado = await TaskController.coletarMarcados(
      interaction,
      customId,
      TaskController.montarModalMarcar(
        customId,
        exibidos.map((l) => ({
          id: l.id,
          texto: `${formatar(l.datahora)} — ${l.texto}`,
        })),
        { titulo: "Concluir lembretes", rotulo: "Lembretes" },
      ),
    );
    if (!resultado) return; // modal fechado ou expirado

    if (resultado.ids.length) {
      await ReminderController.concluirPassados(resultado.ids, usuario_id);
    }

    await resultado.submit.update(
      await SummaryController.montarAtualizacao(usuario_id),
    );
  },
};
