/**
 * Created by Awesome on 2/23/2016.
 */

// require dependencies
const model = require ('model');

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
      'id'   : this.get ('_id') ? this.get ('_id').toString () : false,
      'type' : this.get ('type') || 'info',
      'opts' : this.get ('opts') || ''
    };
  }
}

/**
 * export alert model
 *
 * @type {alert}
 */
exports = module.exports = alert;
