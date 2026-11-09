// Antes desta migration o botão Concluir não era persistido: lembretes já
// entregues são tratados como concluídos para não inundar o primeiro resumo.
module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.bulkUpdate(
      "lembretes",
      { status: "concluido" },
      { status: "entregue" },
    );
  },
  down: async () => {},
};
