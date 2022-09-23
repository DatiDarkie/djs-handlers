const Subcommand = require("./Subcommand");

class Command {
  constructor(label, options) {
    if (typeof label !== 'string')
      throw new Error(`command label type must be string! provided type: ${typeof label}`);
    if (label.includes(' ') || label === '')
      throw new Error(`command label must not be empty and contain no spaces!`);

    // * Command Options
    this.label = label;
    this.caseInsensitive = !!options.caseInsensitive;
    this.guildOnly = !!options.guildOnly;
    this.dmOnly = !!options.dmOnly;
    this.disabled = !!options.disabled;
    this.argsRequired = !!options.argsRequired;
    this.aliases = options.aliases || [];
    this.subcommands = {};
    this.requirements = options.requirements || {};
    this.disabledReply = options.disabledReply || false;
    this.invalidUsageReply = options.invalidUsageReply || false;
    this.cooldownReply = options.cooldownReply || false;

    // * Cooldowns
    this.cooldown = (options.cooldown || 0) * 1000;
    this.cooldownExclusions = options.cooldownExclusions || {};
    if (!this.cooldownExclusions.userIDs)
      this.cooldownExclusions.userIDs = [];

    if (!this.cooldownExclusions.guildIDs)
      this.cooldownExclusions.guildIDs = [];

    if (!this.cooldownExclusions.channelIDs)
      this.cooldownExclusions.channelIDs = [];

    this.usersOnCooldown = {};
    this.cooldownAmounts = {};
    this.cooldownReturns = options.cooldownReturns || 1;
    
    // * Requirements
    this.requirements = {};
    if (options.requirements) {
      Object.assign(this.requirements, options.requirements);
    }

    // Initialize Options
    if (this.caseInsensitive)
      this.label = this.label.toLowerCase();
    
    for (let [subcommandLabel, subcommandOptions] of Object.entries(options.subcommands || {}))
      this.registerSubcommand(subcommandLabel, subcommandOptions);

    this.generator = options.execute ?? false;
  }

  get fullLabel() {
    return this.label;
  }

  cooldownCheck(message) {
    if (this.cooldownExclusionCheck(message) || this.cooldown <= 0) return true;
    
    const userID = message.author.id;
    
    if (this.usersOnCooldown[userID]) {
      this.cooldownAmounts[userID]++;
      return false;
    } else {
      this.usersOnCooldown[userID] = {
        timeout: setTimeout(() => {
          delete this.cooldownAmounts[userID];
          delete this.usersOnCooldown[userID];
        }, this.cooldown),
        startTimestamp: Date.now()
      }
      this.cooldownAmounts[userID] = 0;
      return true;
    }
  }
 
  cooldownExclusionCheck(message) {
    return this.cooldownExclusions.channelIDs.includes(message.channel.id) || this.cooldownExclusions.userIDs.includes(message.author.id) || (message.channel.guild && this.cooldownExclusions.guildIDs.includes(message.guild.id));
  }

  async executeCommand(message, args) {
    if (await this.permissionsCheck(message)) {
      if (this.disabled) {
        let disabledReply = typeof this.disabledReply === 'function' ? await this.disabledReply(message) : this.disabledReply;
        if (disabledReply)
          message.reply(disabledReply);
        return false;
      }
  
      if (this.cooldown > 0 && !this.cooldownCheck(message)) {
        if (this.cooldownReply && (this.cooldownReturns && this.cooldownAmounts[message.author.id] <= this.cooldownReturns)) {
          let cooldownReply = typeof this.cooldownReply === 'function'
            ? this.cooldownReply(message, this.usersOnCooldown[message.author.id].startTimestamp + this.cooldown - Date.now())
            : this.cooldownReply;
          if (cooldownReply)
            message.reply(cooldownReply).then(msg => setTimeout(() => msg.delete(), 3000));
        }
        return false;
      }
      
      let subcommand = this.resolveSubcommand(args[0]);
      if (subcommand)
        return subcommand.executeSubcommand(message, args.slice(1));
      
      if (this.argsRequired && args.length < 1) {
        let reply = typeof this.invalidUsageReply === 'function'
          ? this.invalidUsageReply(message)
          : this.invalidUsageReply;
        if (reply)
          message.reply(reply);
        return false;
      }

      this.generator(message, args);

      return true;
    }
  }

  async permissionsCheck(message) {
    if (this.requirements.custom) {
      if (typeof this.requirements.custom !== "function") 
        throw new Error("Custom requirement is not a function");
      if (!(await this.requirements.custom(message))) return false;
    }
    
    if (this.requirements.userIDs) {
      const userIDs = typeof this.requirements.userIDs === "function" ? await this.requirements.userIDs(message) : this.requirements.userIDs;
      if (!Array.isArray(userIDs))
        throw new Error("User IDs requirement is not an array");
      if (userIDs.length > 0 && !userIDs.includes(message.author.id)) return false;
    }
    if (message.guild) {
      if (this.dmOnly) return false;
      
      if (this.requirements.permissions) {
        const requiredPermissions = typeof this.requirements.permissions === "function" ? await this.requirements.permissions(message) : this.requirements.permissions;
        if (requiredPermissions.length > 0) {
          const permissions = message.channel.permissionsFor(message.author.id);
          for (const permission of requiredPermissions) {
            if (!permissions.has(permission)) return false;
          }
        }
      }
      
      const memberRoles = message.member.roles.cache.map(r => r) || [];
      
      if (this.requirements.roleIDs) {
        const requiredRoleIDs = typeof this.requirements.roleIDs === "function" ? await this.requirements.roleIDs(message) : this.requirements.roleIDs;
        if (!Array.isArray(requiredRoleIDs))
          throw new Error("Role IDs requirement is not an array");
        for (const roleID of requiredRoleIDs) {
          if (!memberRoles.some(r => r.id === roleID)) return false;
        }
      }
      if (this.requirements.roleNames) {
        const roleNames = memberRoles.map((r) => r.name);
        const requiredRoleNames = typeof this.requirements.roleNames === "function" ? await this.requirements.roleNames(message) : this.requirements.roleNames;
        if (!Array.isArray(roleNames)) 
          throw new Error("Role names requirement is not an array");
        for (const roleName of requiredRoleNames) {
          if (!roleNames.includes(roleName)) return false;
        }
      }
    } else if (this.guildOnly) {
      return false;
    }
    return true;
  }

  registerSubcommand(label, options) {
    if (this.resolveSubcommand(label))
      throw new Error(`There is another subcommand registered for label ${label} !`);
    
    options = typeof options === 'function' ? { execute: options } : options;
    this.subcommands[label] = new Subcommand(label, Object.assign(options, {
      caseInsensitive: this.caseInsensitive
    }), this);
  }
  
  unregisterSubcommand(label) {
    if (!label)
      return false;
    let subcommand = this.subcommands[label];
    delete this.subcommands[label];
    return !!subcommand;
  }
  
  resolveSubcommand(label) {
    if (typeof label !== 'string') return null;
    return Object.values(this.subcommands).find(subcommand => {
      let subcommandLabel = subcommand.label;
      if (subcommand.caseInsensitive)
        subcommandLabel = subcommandLabel.toLowerCase();
      return subcommandLabel === subcommand.label;
    }) ?? null;
  }

  toString() {
    return `[Command ${this.label}]`;
  }
}

module.exports = Command;