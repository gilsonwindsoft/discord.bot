const { DataTypes } = require("sequelize");

// Baseline: instalações existentes já têm `apontamentos` criada pelo antigo `sync()`.
module.exports = {
  up: async ({ context: queryInterface }) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes("apontamentos")) return;

    await queryInterface.createTable("apontamentos", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      usuario: { type: DataTypes.STRING },
      descricao: { type: DataTypes.STRING },
      datahora_inicio: { type: DataTypes.DATE },
      datahora_fim: { type: DataTypes.DATE },
      duracao_segundos: { type: DataTypes.INTEGER },
      channel_id: { type: DataTypes.STRING },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },
  // Nunca remove dados históricos.
  down: async () => {},
};
