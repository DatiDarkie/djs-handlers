const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  description: "Display speed of the bot.",
  disabled: false,
  argsRequired: true,
  aliases: [
    {
      name: "pong",
      prefix: false,
    },
    {
      name: "pong",
      prefix: true,
    },
  ],
  requirements: {
    userIDs: ['480216663850221569']
  },
  subcommands: {
    latency(message) {
      message.reply(`Latency!`);
    }
  },
  cooldown: 5,
  execute(message) {
    message.reply({ embeds: [
      new EmbedBuilder()
      .setColor(0x00ff68)
      .setDescription(`💓 Heart Beat: ${Date.now() - message.createdTimestamp}ms\n📊 Discord API: ${message.client.ws.ping} ms`)
      .setTimestamp(),
    ]});
  },
};
