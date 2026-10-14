const { DataTypes } = require("sequelize");

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable("tarefas", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      usuario_id: { type: DataTypes.STRING(32), allowNull: false },
      texto: { type: DataTypes.STRING(200), allowNull: false },
      concluida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      concluida_em: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("tarefas", ["usuario_id", "concluida"]);
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable("tarefas");
  },
};
