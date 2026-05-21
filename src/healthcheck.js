const { Sequelize } = require("sequelize");
const { database } = require("../config");

const sequelize = new Sequelize(database.mysqlUrl, { logging: false });

sequelize
  .authenticate()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Healthcheck failed:", error.message);
    process.exit(1);
  });
