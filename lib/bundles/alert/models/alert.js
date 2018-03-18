// require local dependencies
const model = require ('model');

/**
 * create alert model class
 */
class alert extends model {

  /**
   * construct alert model class
   */
  constructor () {
    // run super
    super (...arguments);

    // bind public methods
    this.sanitise = this.sanitise.bind (this);
  }

  /**
   * sanitise alert
   *
   * @return {Object}
   */
  async sanitise () {
    // check arguments
    if (arguments && arguments.length) {
      // return sanitised with arguments
      return await super.__sanitiseModel (...arguments);
    }

    // return sanitised with default
    return await super.__sanitiseModel ({
      'field'          : '_id',
      'sanitisedField' : 'id',
      'default'        : false
    }, {
      'field'   : 'type',
      'default' : 'info'
    }, {
      'field'   : 'opts',
      'default' : ''
    });
  }
}

/**
 * export alert model class
 *
 * @type {alert}
 */
exports = module.exports = alert;
