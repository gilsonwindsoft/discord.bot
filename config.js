function requireConfig(name, value) {
  if (!value) {
    throw new Error(`Missing required configuration: ${name}`);
  }

  return value;
}

module.exports = {
  token: requireConfig("DISCORD_TOKEN", process.env.DISCORD_TOKEN),
  database: {
    mysqlUrl: requireConfig("MYSQL_URL", process.env.MYSQL_URL),
  },
};
