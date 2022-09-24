const fs = require('node:fs');
const { CommandsClient } = require('./src/index');
const { clientOptions, commandOptions } = require('./config.json');
const client = new CommandsClient(clientOptions, commandOptions);

require('dotenv').config();

client.on('ready', () => {
  console.log(`Logged in as "${client.user.tag}"`);
});

fs.readdirSync('commands').forEach(commandsFolderName => {
  for (let commandFileName of fs.readdirSync(`commands/${commandsFolderName}`))
    client.registerCommand(require(`./commands/${commandsFolderName}/${commandFileName}`));
});

client.login(process.env.TOKEN);