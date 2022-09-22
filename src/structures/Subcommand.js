class Subcommand {
  constructor(label, options, parentCommand) {
    if (typeof label !== 'string')
      throw new Error(`subcommand label type must be string! provided type: ${typeof label}`);
    if (label.includes(' ') || label === '')
      throw new Error(`subcommand label must not be empty and contain no spaces!`);
    
    this.parentCommand = parentCommand;
    this.label = label;
    this.caseInsensitive = !!options.caseInsensitive;
    this.generator = options.execute || false;
  }

  get fullLabel() {
    return `${this.parentCommand.fullLabel} ${this.label}`;
  }

  executeSubcommand(message, args) {
    if (this.generator)
      this.generator(message, args);
  }
}

console.log(new Subcommand('hello'));

module.exports = Subcommand;