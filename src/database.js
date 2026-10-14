const { Sequelize } = require("sequelize");
const { Umzug, SequelizeStorage } = require("umzug");
const { database } = require("../config");
const path = require("path");
const { success, info, error } = require("./utils/logger");

const sequelize = new Sequelize(database.mysqlUrl, { logging: false });

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, "migrations/*.js").replace(/\\/g, "/"),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: undefined,
});

async function connectDatabase() {
  try {
    await sequelize.authenticate();

    const executed = await umzug.up();
    for (const migration of executed) {
      info(`Migration aplicada: ${migration.name}`);
    }

    success("📂 Conectado ao banco de dados");
  } catch (e) {
    error("Erro ao se conectar ao banco de dados!", e);
    process.exit(1);
  }
}

module.exports = { connectDatabase, sequelize };
