const { Collection } = require("discord.js");
const path = require("path");
const { getFiles } = require("../utils/files");
const logger = require("../utils/logger");

module.exports = async (client) => {
  const buttonPath = path.join(__dirname, "../interactions/Button");
  const buttonFiles = getFiles(buttonPath);

  client.buttons = new Collection();

  for (const filePath of buttonFiles) {
    const button = require(filePath);
    if (button.data && button.execute) {
      client.buttons.set(button.data.name, button);
      logger.debug(
        `The button ${`/${button.data.name}`.magenta} (${
          filePath.replace(buttonPath, "").brightMagenta
        }) was successfully registered`,
      );
    } else {
      logger.warn(
        `The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
};
