const Command = require('./Command');
const Alias = require('./Alias');
const { Client } = require('discord.js');

class CommandsClient extends Client {
  constructor(clientOptions, commandOptions) {
    super(clientOptions);
    
    this.commandOptions = Object.assign({
      prefix: '@mention ',
      argsSplitter: str => str.split(/ +/),
      ignoreBots: true,
      ignoreSelf: true,
      defaultCommandOptions: {},
    }, commandOptions);
    
    this.commands = {};
    this.commandsAliases = [];
    this.guildsPrefixes = {};
    
    this.once('ready', () => {
      this.commandOptions.prefix = this.resolvePrefix(this.commandOptions.prefix);
    });
    
    this.on('messageCreate', async (message) => {
      if (
        (this.commandOptions.ignoreBots && !message.author.bot) &&
        (this.commandOptions.ignoreSelf && (this.user.id !== message.author.id))
      ) {
        let prefix = this.checkPrefix(message);
        let args = this.commandOptions.argsSplitter(prefix ? message.content.slice(prefix.length).trim() : message.content);
        let commandName = args.shift();
        
        message.prefix = prefix || null;
        message.command = this.resolveCommand(commandName, !!prefix);
        
        if (message.command) {
          await message.command.executeCommand(message, args, this);
        }
      }
    });
  }
  
  get prefix() {
    return this.commandOptions.prefix;
  }

  get util() {
    try {
      let util = require('../util/util');
      return util ? util : {};
    } catch {
      return {};
    }
  }

  checkPrefix(message) {
    let prefixes = this.commandOptions.prefix;
    
    if (Array.isArray(prefixes)) {
      return prefixes.find(prefix => message.content.replace(/<@!/gi, '<@').startsWith(prefix));
    } else {
      return message.content.replace(/<@!/gi, '<@').startsWith(prefixes) && prefixes;
    }
  }
  
  resolveCommand(commandLabel, providedPrefix = true) {
    for (let command of [...Object.values(this.commands), ...this.commandsAliases]) {
      let cmdLabel = command.label || command.name;
      if (command.caseInsensitive)
        commandLabel = commandLabel.toLowerCase();
      if (cmdLabel === commandLabel && providedPrefix == (command.prefix ?? true)) {
        if ('commandLabel' in command)
          return this.resolveCommand(command.commandLabel);
        return command;
      }
    }
  }
  
  registerCommand(commandOptions) {
    commandOptions = Object.assign(Object.create(this.commandOptions.defaultCommandOptions), commandOptions);
    
    const command = new Command(commandOptions.name, commandOptions);
    
    if (this.resolveCommand(command.label)) throw new Error(`There is another command/alias registered for name ${command.label}`);
    this.commands[command.label] = command;
    for (let alias of command.aliases) {
      this.registerCommandAlias(alias, command.label);
    }
  } 
  
  registerCommandAlias(aliasOptions, commandLabel) {
    let command = this.resolveCommand(commandLabel);
    if (!command)
      throw new Error(`There is no command registered for name ${commandLabel}`);
    aliasOptions = typeof aliasOptions === 'string' ? { name: aliasOptions } : aliasOptions;
    let alias = new Alias(aliasOptions, command);
    if (this.resolveCommand(alias.name, !!alias.prefix))
      throw new Error(`There is another command/alias registered for name ${alias.name}`);
    this.commandsAliases.push(alias);
  }
  
  registerGuildPrefix(guildId, prefixes) {
    if (!this.guilds.cache.has(guildId)) throw new Error(`The guild '${guildId}' isn't cached!.`);
    this.guildPrefixes[guildId] = this.resolvePrefix(prefixes);
  }
  
  resolvePrefix(prefixes) {
    prefixes = Array.isArray(prefixes) ? prefixes : [prefixes];
    prefixes = prefixes.map(prefix => {
      if (typeof prefix === 'string') {
        prefix = prefix.replace(/@mention/gi, `<@${this.user.id}>`);
        return prefix;
      }
      throw new Error(`Invalid format "${prefix}"`);
    });
    return prefixes.length > 1 ? prefixes : prefixes[0];
  }

  toString() {
    return `[CommandsClient: ${this.user.username}]`;
  }
}

module.exports = CommandsClient;