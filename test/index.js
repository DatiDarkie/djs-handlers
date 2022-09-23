const path = require('node:path');
const { CommandsClient } = require('../src/index');
const clientOptions = {
  intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'MessageContent'],
  allowedMentions: {
    parse: ['users', 'roles']
  }
};

const client = new CommandsClient(clientOptions, {
  prefix: '-',
  defaultCommandOptions: {
    caseInsensitive: true,
    guildOnly: true,
    cooldown: 3,
    invalidUsageReply(message) {
      let command = message.command;
      return `Invalid usage: Command: ${command.label}`;
    },
    disabledReply: 'this command is currently disabled!',
    cooldownReply(message, remainingTime) {
      console.log('Cooldown ' + remainingTime);
      return `**${message.author.username}, Cooldown (${(remainingTime / 1e3).toFixed(2)} seconds left)**`;
    }
  }
});

const fs = require('fs');

require('dotenv').config();

client.on('ready', () => {
  console.log(`Logged in as "${client.user.tag}" ${client.user.id}`);
});

for (let commandFileName of fs.readdirSync(path.join(__dirname, 'commands'))) {
  let pull = require(`./commands/${commandFileName}`);
  client.registerCommand(pull);
}

client.login(process.env.TOKEN);