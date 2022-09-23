const util = require('util');

util.shortNumberExtensions = {
  'k': 1e3,
  'm': 1e6,
  'b': 1e9,
  't': 1e12,
  'q': 1e15,
  's': 1e18,
  'p': 1e21,
  'e': 1e24,
  'z': 1e27,
  'y': 1e30
}

module.exports = Object.assign(util, {
  awaiter(callbackfn, initialValue = 0) {
    return new Promise((resolve, reject) => {
      let stop = (lastValue, rejected = false) => rejected ? reject(lastValue) : resolve(lastValue);
      let next = (currentValue) => callbackfn([next, stop], currentValue);
      next(initialValue);
    });
  },

  fromShortNumber(stringNumber) {
    var a = this.toString();
    var num = a.replace(/[^0-9.]/g, '');
    var unit = a.replace(/[0-9.]/g, '');

    if (unit in util.shortNumberExtensions) {
      num = Number(num) * util.shortNumberExtensions[unit];
    }
    
    return num;
  },

  toShortNumber(value) {
    return Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  }
});