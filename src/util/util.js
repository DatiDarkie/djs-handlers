class Util {
  /**
   * @param {number} timeout 
   * @returns {Promise<undefined>}
   */
  static async sleep (timeout) {
    if (!Number.isInteger(timeout)) timeout = 0;
    return new Promise(resolve => setTimeout(() => resolve(), timeout));
  }

  /**
   * @param {Date | number} startDate 
   * @param {Date | number} endDate 
   * @returns {number}
   */
  static calculateTimeout (startDate, endDate) {
    startDate = +new Date(startDate);
    endDate = +new Date(endDate);
    return startDate && endDate && (endDate > startDate) ? (endDate - startDate) : 0;
  }
  
  /**
   * @param {*} value 
   * @param {Intl.NumberFormatOptions} options 
   * @returns 
   */
  static numberFormat(value, options) {
    options = Object.assign({
      maximumFractionDigits: 2,
      notation: 'compact'
    }, options);
    let number = Number(value);
    if (number !== 0 && (!number || value === '')) return null;
    return Intl.NumberFormat(options.language || 'en-UK', options).format(number);
  }
}

module.exports = Util;