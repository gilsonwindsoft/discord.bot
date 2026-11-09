const TaskController = require("../../../controllers/task");
const SummaryController = require("../../../controllers/summary");

module.exports = {
  data: {
    name: "resumo-tarefas-marcar",
  },
  execute: async (interaction) => {
    const usuario_id = interaction.user.id;
    const pendentes = await TaskController.listarPendentes(usuario_id);

    if (!pendentes.length) {
      return interaction.update(
        await SummaryController.montarAtualizacao(usuario_id),
      );
    }

    const customId = `resumo-tarefas-marcar-${interaction.id}`;
    const resultado = await TaskController.coletarMarcados(
      interaction,
      customId,
      TaskController.montarModalMarcar(customId, pendentes),
    );
    if (!resultado) return; // modal fechado ou expirado

    if (resultado.ids.length) {
      await TaskController.concluir(resultado.ids, usuario_id);
    }

    await resultado.submit.update(
      await SummaryController.montarAtualizacao(usuario_id),
    );
  },
};
