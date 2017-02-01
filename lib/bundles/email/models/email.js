/**
 * Created by Awesome on 2/23/2016.
 */

// use strict
'use strict';

// require dependencies
const model = require ('model');

/**
 * create email model
 */
class email extends model {
  /**
   * construct email model
   *
   * @param a
   * @param b
   */
  constructor (a, b) {
    // run super
    super (a, b);
  }
}

/**
 * export email model
 *
 * @type {email}
 */
module.exports = email;
