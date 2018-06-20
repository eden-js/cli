// require local dependencies
const daemon = require ('daemon');

/**
 * create event daemon class
 *
 * @compute 0
 */
class eventDaemon extends daemon {

  /**
   * construct event daemon class
   */
  constructor () {
    // run super
    super ();

    // bind private variables
    this._prefix    = 'eden.events.daemon';
    this._endpoints = {};

    // bind private methods
    this._build           = this._build.bind (this);
    this._onEndpointAdd   = this._onEndpointAdd.bind (this);
    this._onEndpointCount = this._onEndpointCount.bind (this);

    // run build
    this._build ();
  }

  /**
   * build event daemon
   *
   * @private
   */
  _build () {
    // set endpoint add endpoint
    this.eden.endpoint (`${this._prefix}.endpoint.add`, this._onEndpointAdd, true);

    // set endpoint count endpoint
    this.eden.endpoint (`${this._prefix}.endpoint.count`, this._onEndpointCount, true);
  }

  /**
   * on endpoint add
   *
   * @param {String} event
   *
   * @returns {Promise<Number>}
   *
   * @private
   */
  async _onEndpointAdd (event) {
    // lock endpoints
    const mutex = await this.eden.lock (`${this._prefix}.endpoint.lock`);

    // ensure endpoint
    if (typeof this._endpoints[event] === 'undefined') {
      // initialise endpoint
      this._endpoints[event] = 0;
    }

    // increment endpoint
    const endpoints = ++this._endpoints[event];

    // unlock endpoints
    mutex ();

    // return endpoints
    return endpoints;
  }

  /**
   * on endpoint count
   *
   * @param {String} event
   *
   * @returns {Promise<Number>}
   *
   * @private
   */
  async _onEndpointCount (event) {
    // lock endpoints
    const mutex = await this.eden.lock (`${this._prefix}.endpoint.lock`);

    // ensure endpoint
    if (typeof this._endpoints[event] === 'undefined') {
      // initialise endpoint
      this._endpoints[event] = 0;
    }

    // set endpoints
    const endpoints = this._endpoints[event];

    // unlock endpoints
    mutex ();

    // return endpoints
    return endpoints;
  }

}

/**
 * export event daemon class
 *
 * @type {eventDaemon}
 */
exports = module.exports = eventDaemon;
