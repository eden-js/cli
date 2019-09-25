// Require class dependencies
import EventEmitter from 'events';

// Require local dependencies
import eden from 'eden';

/**
 * Create Base class
 */
export default class Base extends EventEmitter {
  /**
   * Construct Base class
   */
  constructor() {
    // Run super
    super();

    // Bind public variables
    this.eden = eden;
    this.call = eden.call;
    this.logger = eden.logger;
  }
}