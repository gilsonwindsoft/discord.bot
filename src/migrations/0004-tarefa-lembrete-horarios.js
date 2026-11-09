const { DataTypes } = require("sequelize");

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable("tarefa_lembrete_horarios", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      usuario_id: { type: DataTypes.STRING(32), allowNull: false },
      posicao: { type: DataTypes.TINYINT, allowNull: false },
      horario: { type: DataTypes.STRING(5), allowNull: false },
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex(
      "tarefa_lembrete_horarios",
      ["usuario_id", "posicao"],
      { unique: true },
    );
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable("tarefa_lembrete_horarios");
  },
};
