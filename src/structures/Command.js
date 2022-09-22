const Subcommand = require("./Subcommand");

class Command {
  constructor(label, options) {
    if (typeof label !== 'string')
      throw new Error(`command label type must be string! provided type: ${typeof label}`);
    if (label.includes(' ') || label === '')
      throw new Error(`command label must not be empty and contain no spaces!`);

    this.label = label;
    this.caseInsensitive = !!options.caseInsensitive;
    this.guildOnly = !!options.guildOnly;
    this.dmOnly = !!options.dmOnly;
    this.subcommands = {};
    this.requirements = options.requirements || {};

    if (options.requirements) {
      if (options.requirements.custom) this.requirements.custom = options.requirements.custom;
      if (options.requirements.userIDs) this.requirements.userIDs = options.requirements.userIDs;
      if (options.requirements.roleIDs) this.requirements.roleIDs = options.requirements.roleIDs;
      if (options.requirements.channelIDs) this.requirements.channelIDs = options.requirements.channelIDs;
      if (options.requirements.roleNames) this.requirements.roleNames = options.requirements.roleNames;
    }

    if (this.caseInsensitive)
      this.label = this.label.toLowerCase();
    
    for (let [subcommandLabel, subcommandOptions] of (options.subcommands || {}))
      this.registerSubcommand(subcommandLabel, subcommandOptions);

    this.generator = options.execute ?? false;
  }

  get fullLabel() {
    return this.label;
  }

  executeCommand(message, args) {
    if (this.permissionsCheck(message)) {
      let subcommand = this.resolveSubcommand(args[0]);
      if (subcommand) {
        return subcommand.executeSubcommand(message, args.slice(1));
      }
      return this.generator(message, args);
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
    if (!label) return false;
    let subcommand = this.subcommands[label];
    delete this.subcommands[label];
    return !!subcommand;
  }
  
  resolveSubcommand(label) {
    if (typeof label !== 'string') return null;
    return Object.values(this.subcommands).find(subcommand => {
      let subcommandLabel = subcommand.name;
      if (subcommand.caseInsensitive)
        subcommandLabel = subcommandLabel.toLowerCase();
      return subcommandLabel === subcommand.label;
    }) ?? null;
  }
}

module.exports = Command;