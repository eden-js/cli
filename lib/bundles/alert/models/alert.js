/**
 * Created by Awesome on 2/23/2016.
 */

// use strict
'use strict';

// require dependencies
var model = require ('model');

/**
 * create alert model
 */
class alert extends model {
  /**
   * construct alert model
   *
   * @param a
   * @param b
   */
  constructor (a, b) {
    // run super
    super (a, b);

    // bind methods
    this.sanitise = this.sanitise.bind (this);
  }

  /**
   * sanitise alert
   */
  async sanitise () {
    // return sanitised alert model
    return {
      'id'      : this.get ('_id') ? this.get ('_id').toString () : false,
      'type'    : this.get ('type')    || 'info',
      'message' : this.get ('message') || '',
      'options' : this.get ('options') || false
    };
  }
}

/**
 * export alert model
 *
 * @type {alert}
 */
module.exports = alert;
