/**
 * Created by Awesome on 2/6/2016.
 */

// use strict
'use strict';

// import local dependencies
const model = require ('model');

/**
 * create user class
 */
class example extends model {
  /**
   * construct example model
   *
   * @param attrs
   * @param options
   */
  constructor (attrs, options) {
    // run super
    super (attrs, options);
  }
}

/**
 * export user class
 * @type {user}
 */
exports = module.exports = example;
