const { STRING, BOOLEAN, TINYINT } = require("sequelize");
const { sequelize } = require("../database");

const TarefaLembreteHorario = sequelize.define(
  "TarefaLembreteHorario",
  {
    usuario_id: { type: STRING(32), allowNull: false },
    posicao: { type: TINYINT, allowNull: false },
    horario: { type: STRING(5), allowNull: false },
    ativo: { type: BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "tarefa_lembrete_horarios",
    timestamps: true,
  },
);

module.exports = TarefaLembreteHorario;
