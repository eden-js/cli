// Require local class dependencies
const Daemon = require('daemon');

/**
 * Create Example Daemon class
 *
 * @compute
 * @express
 */
class ExampleDaemon extends Daemon {

  /**
   * Construct Example Daemon class
   */
  constructor () {
    // Run super
    super();

  }

}

/**
 * Export Example Daemon class
 *
 * @type {ExampleDaemon}
 */
exports = module.exports = ExampleDaemon;
