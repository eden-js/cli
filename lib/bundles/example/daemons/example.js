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
   *
   * @param {eden} eden
   */
  constructor (eden) {
    // run super eden
    super (eden);

    // check if compute thread
    if (eden.compute) {
      // we are in an express thread
    } else {
      // we are in a compute thread
    }
  }
}

/**
 * export example daemon class
 *
 * @type {example}
 */
module.exports = example;
