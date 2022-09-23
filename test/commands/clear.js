module.exports = {
  name: 'clear',
  description: 'Clears a channel messages.',
  subcommands: {},
  args: {},
  requirements: {},
  execute(message, args) {
    message.reply(`Clearing Messages...`);
  }
}