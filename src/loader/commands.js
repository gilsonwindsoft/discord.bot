const { REST, Routes, Collection } = require("discord.js");
const path = require("path");
const { getFiles } = require("../utils/files");
const logger = require("../utils/logger");
const { token } = require("../../config.json");

module.exports = async (client) => {
  const commandsPath = path.join(__dirname, "../interactions/Command");
  const commandFiles = getFiles(commandsPath);

  const commands = [];
  client.commands = new Collection();

  for (const filePath of commandFiles) {
    const command = require(filePath);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      logger.debug(
        `The command ${`/${command.data.name}`.magenta} (${
          filePath.replace(commandsPath, "").brightMagenta
        }) was successfully registered`,
      );

      commands.push(command.data.toJSON());
    } else {
      logger.warn(
        `The command at ${filePath.yellow} is missing a required "data" or "execute" property.`,
      );
    }
  }

  const rest = new REST({ version: "10" }).setToken(token);
  (async () => {
    try {
      logger.info(
        `Started refreshing ${
          String(commands.length).blue
        } application (/) commands.`,
      );
      const data = await rest.put(
        Routes.applicationCommands(client.application.id),
        { body: commands },
      );
      logger.info(
        `Successfully reloaded ${
          String(data.length).blue
        } application (/) commands.`,
      );
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  })();
};
