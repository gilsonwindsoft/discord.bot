const { Events } = require("discord.js");
const { client } = require("../index");
const logger = require("../utils/logger");

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const button = interaction.client.buttons.find(
    ({ data: b }) =>
      b.name === interaction.customId ||
      (b.startsWith && interaction.customId.startsWith(b.name)),
  );

  if (!button) {
    logger.error(`No button matching ${interaction.customId} was found.`);
    return;
  }

  try {
    await button.execute(interaction);
  } catch (error) {
    logger.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this button!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this button!",
        ephemeral: true,
      });
    }
  }
});
