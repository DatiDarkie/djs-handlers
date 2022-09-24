const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: 'ping',
  aliases: ['pong', 'speed'],
  description: 'Display speed of the bot.',
  execute(message) {
    message.reply({ embeds: [
      new EmbedBuilder()
      .setColor(0x00ff68)
      .setDescription(`💓 Heart Beat: ${Math.abs(Date.now() - message.createdTimestamp)}ms\n📊 Discord API: ${message.client.ws.ping} ms`)
      .setTimestamp(),
    ]});
  }
}