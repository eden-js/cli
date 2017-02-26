/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

// require local dependencies
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
    super ();
    
  }
}

/**
 * export example daemon class
 *
 * @type {example}
 */
exports = module.exports = example;
