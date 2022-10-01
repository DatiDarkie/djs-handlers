class Alias {
  constructor(alias, command) {
    if (typeof alias === "string") alias = { name: alias };
    
    this.name = alias.name;

    if (typeof alias.name !== 'string')
      throw new Error(`alias name type must be string! provided type: ${typeof alias.name}`);
    if (alias.name.includes(' ') || alias.name === '')
      throw new Error(`alias name must not be empty and contain no spaces!`);
    
    this.prefix = alias.prefix ?? true;
    this.caseInsensitive = alias.caseInsensitive ?? command.caseInsensitive;

    if (this.caseInsensitive)
      this.name = this.name.toLowerCase();

    this.commandLabel = command.label;
  }
  
  toString(prefix) {
    return (prefix || "") + this.name;
  }
}

module.exports = Alias;