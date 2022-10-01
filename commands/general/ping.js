const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: 'ping',
  aliases: ['pong', 'speed'],
  description: 'Display speed of the bot.',
  execute(message) {
    let now = Date.now();
    
    message.reply(`Pong!`).then(msg => {
      msg.edit(`${msg.content} Latency ${Date.now() - now} ms`);
    });
  }
}