const { DataTypes } = require("sequelize");

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable("lembretes", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      criador_id: { type: DataTypes.STRING(32), allowNull: false },
      destinatario_id: { type: DataTypes.STRING(32), allowNull: false },
      guild_id: { type: DataTypes.STRING(32), allowNull: false },
      channel_id: { type: DataTypes.STRING(32), allowNull: false },
      texto: { type: DataTypes.STRING(500), allowNull: false },
      datahora: { type: DataTypes.DATE, allowNull: false },
      recorrencia: { type: DataTypes.STRING(16), allowNull: true },
      status: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "ativo",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("lembretes", ["status", "datahora"]);
    await queryInterface.addIndex("lembretes", ["criador_id", "status"]);
    await queryInterface.addIndex("lembretes", ["destinatario_id", "status"]);
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable("lembretes");
  },
};
