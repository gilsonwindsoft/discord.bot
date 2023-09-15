const { Sequelize } = require("sequelize");
const { database } = require("../config.json");
const path = require("path");
const { getFiles } = require("./utils/files");
const { success, error } = require("./utils/logger");

const sequelize = new Sequelize(database.mysqlUrl, { logging: false });

async function connectDatabase() {
	try {
		await sequelize.authenticate();

		const filePath = path.join(__dirname, "./models");
		const files = (await getFiles(filePath)).filter((file) => file.endsWith(".js"));
		for (const file of files) {
			const model = require(file);
			model.sync();
		}

		success("📂 Conectado ao banco de dados");
	} catch (e) {
		error("Erro ao se conectar ao banco de dados!", e);
		process.exit(1);
	}
}

module.exports = { connectDatabase, sequelize };