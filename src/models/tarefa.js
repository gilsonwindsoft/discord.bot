const { STRING, BOOLEAN, DATE } = require("sequelize");
const { sequelize } = require("../database");

const Tarefa = sequelize.define(
  "Tarefa",
  {
    usuario_id: { type: STRING(32), allowNull: false },
    texto: { type: STRING(200), allowNull: false },
    concluida: { type: BOOLEAN, allowNull: false, defaultValue: false },
    concluida_em: { type: DATE, allowNull: true },
  },
  {
    tableName: "tarefas",
    timestamps: true,
  },
);

module.exports = Tarefa;
