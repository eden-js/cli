// use strict
'use strict';

// require local dependencies
const controller = require ('controller');

/**
 * build example controller
 */
class example extends controller {
  /**
   * construct example controller class
   */
  constructor () {
    // run super
    super (...arguments);
  }
}

/**
 * export module controller
 *
 * @type {example}
 */
exports = module.exports = example;
