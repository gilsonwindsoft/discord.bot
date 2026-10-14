const { STRING, DATE } = require("sequelize");
const { sequelize } = require("../database");

const Lembrete = sequelize.define(
  "Lembrete",
  {
    criador_id: { type: STRING(32), allowNull: false },
    destinatario_id: { type: STRING(32), allowNull: false },
    guild_id: { type: STRING(32), allowNull: false },
    channel_id: { type: STRING(32), allowNull: false },
    texto: { type: STRING(500), allowNull: false },
    datahora: { type: DATE, allowNull: false },
    recorrencia: { type: STRING(16), allowNull: true },
    status: { type: STRING(16), allowNull: false, defaultValue: "ativo" },
  },
  {
    tableName: "lembretes",
    timestamps: true,
  },
);

module.exports = Lembrete;
