
// require dependencies
const daemon = require ('daemon');

/**
 * build example dameon class
 *
 * @compute
 * @express
 */
class example extends daemon {
  /**
   * construct example daemon class
   */
  constructor () {
    // run super eden
    super (...arguments);

  }
}

/**
 * export example daemon class
 *
 * @type {example}
 */
exports = module.exports = example;
