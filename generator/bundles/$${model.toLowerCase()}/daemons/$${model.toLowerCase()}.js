
// import dependencies
const Daemon = require('daemon');

// require helpers
const $${model.toLowerCase()}Helper = helper('$${model.toLowerCase()}');

/**
 * extend $${model.toLowerCase()} Daemon
 *
 * @compute
 *
 * @extends {Daemon}
 */
class $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}Daemon extends Daemon {
  /**
   * construct $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} Daemon
   */
  constructor() {
    // run super
    super();

    // bind build method
    this.build = this.build.bind(this);

    // build
    this.building = this.build();
  }

  /**
   * build $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} Daemon
   */
  async build() {

  }
}

/**
 * export built $${model.toLowerCase()} daemon
 *
 * @type {$${model.toLowerCase()}Daemon}
 */
module.exports = $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}Daemon;
