const { STRING, INTEGER, DATE } = require("sequelize");
const { sequelize } = require("../database");

const Away = sequelize.define(
  "Away",
  {
    usuario: {
      type: STRING,
      required: true,
    },
    descricao: {
      type: STRING,
      required: true,
    },
    datahora_inicio: {
      type: DATE,
      required: true,
      defaultValue: new Date(),
    },
    datahora_fim: {
      type: DATE,
    },
    duracao_segundos: {
      type: INTEGER,
    },
    channel_id: {
      type: STRING,
      required: true,
    },
  },
  {
    tableName: "apontamentos",
    timestamps: true,
  },
);

module.exports = Away;
