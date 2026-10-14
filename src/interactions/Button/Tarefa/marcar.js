const TaskController = require("../../../controllers/task");

const MODAL_TIMEOUT_MS = 10 * 60 * 1000;

module.exports = {
  data: {
    name: "tarefa-marcar",
  },
  execute: async (interaction) => {
    const usuario_id = interaction.user.id;
    const pendentes = await TaskController.listarPendentes(usuario_id);

    if (!pendentes.length) {
      return interaction.update(
        await TaskController.montarPendentes(usuario_id),
      );
    }

    const customId = `tarefa-marcar-${interaction.id}`;
    await interaction.showModal(
      TaskController.montarModalMarcar(customId, pendentes),
    );

    let submit;
    try {
      submit = await interaction.awaitModalSubmit({
        filter: (i) => i.customId === customId,
        time: MODAL_TIMEOUT_MS,
      });
    } catch {
      return; // modal fechado ou expirado
    }

    // Grupo sem nenhuma caixa marcada pode não vir no envio.
    // Collection.flatMap espera Collections; converter para array antes.
    const ids = [...submit.fields.fields.values()]
      .filter((field) => field.customId.startsWith("grupo-"))
      .flatMap((field) => field.values || [])
      .map(Number);

    if (ids.length) await TaskController.concluir(ids, usuario_id);

    await submit.update(await TaskController.montarPendentes(usuario_id));
  },
};
