// Require local class dependencies
const Daemon = require('daemon');

/**
 * Create Event Daemon class
 *
 * @compute 0
 */
class EventDaemon extends Daemon {

  /**
   * Construct Event Daemon class
   */
  constructor () {
    // Run super
    super();

    // Set private variables
    this._prefix    = 'eden.events.Daemon';
    this._endpoints = {};

    // Bind private methods
    this._build           = this._build.bind(this);
    this._onEndpointAdd   = this._onEndpointAdd.bind(this);
    this._onEndpointCount = this._onEndpointCount.bind(this);

    // Run build
    this._build();
  }

  /**
   * Build Event Daemon
   *
   * @private
   */
  _build () {
    // Set endpoint add endpoint
    this.eden.endpoint(`${this._prefix}.endpoint.add`, this._onEndpointAdd, true);

    // Set endpoint count endpoint
    this.eden.endpoint(`${this._prefix}.endpoint.count`, this._onEndpointCount, true);
  }

  /**
   * On endpoint add
   *
   * @param   {string} event
   *
   * @returns {Promise<number>}
   *
   * @private
   *
   * @async
   */
  async _onEndpointAdd (event) {
    // Lock endpoints
    const mutex = await this.eden.lock(`${this._prefix}.endpoint.lock`);

    // Ensure endpoint
    if (typeof this._endpoints[event] === 'undefined') {
      // Initialise endpoint
      this._endpoints[event] = 0;
    }

    // Increment endpoint
    const endpoints = ++this._endpoints[event];

    // Unlock endpoints
    mutex();

    // Return endpoints
    return endpoints;
  }

  /**
   * On endpoint count
   *
   * @param {string} event
   *
   * @returns {Promise<number>}
   *
   * @private
   *
   * @async
   */
  async _onEndpointCount (event) {
    // Lock endpoints
    const mutex = await this.eden.lock(`${this._prefix}.endpoint.lock`);

    // Ensure endpoint
    if (typeof this._endpoints[event] === 'undefined') {
      // Initialise endpoint
      this._endpoints[event] = 0;
    }

    // Set endpoints
    const endpoints = this._endpoints[event];

    // Unlock endpoints
    mutex();

    // Return endpoints
    return endpoints;
  }

}

/**
 * Export Event Daemon class
 *
 * @type {EventDaemon}
 */
exports = module.exports = EventDaemon;
