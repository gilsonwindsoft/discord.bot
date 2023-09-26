require("colors");

require("./database").connectDatabase();

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('../config.json');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

	require('./loader/commands')(c);
	require('./handlers/commands');

	require('./loader/buttons')(c);
	require('./handlers/buttons');
});

// Log in to Discord with your client's token
client.login(token);

require("./jobs").startJobs(client);

module.exports = { client };