// Require class dependencies
const EventEmitter = require('events');

// Require local dependencies
const eden = require('eden');

/**
 * Create Base class
 */
class Base extends EventEmitter {
  /**
   * Construct Base class
   */
  constructor() {
    // Run super
    super();

    // Bind public variables
    this.eden = eden;
    this.logger = eden.logger;
  }
}

/**
 * Export Base class
 *
 * @type {Base}
 */
module.exports = Base;
