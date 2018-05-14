// Require dependencies
const uuid = require ('uuid');

// Require local class dependencies
const Helper = require ('helper');

/**
 * Create Event Helper class
 */
class EventHelper extends Helper {

  /**
   * Construct Event Helper class
   */
  constructor () {
    // Run super
    super ();

    // Set private variables
    this._prefix = 'eden.events.daemon';

    // Bind public methods
    this.call     = this.call.bind (this);
    this.endpoint = this.endpoint.bind (this);
  }

  /**
   * Call a given event with the given args
   *
   * @param   {String} event
   * @param   {Array}  args
   *
   * @returns {Promise<Array>}
   */
  async call (event, ...args) {
    // Set emission
    const emission = {
      'id'    : uuid (),
      'event' : event,
      'count' : await this.eden.call (`${this._prefix}.endpoint.count`, event, true),
      'args'  : args || []
    };

    // Create result promise
    return new Promise ((resolve) => {
      // Set results
      const results = [];

      // Set on event
      this.eden.on (emission.id, (result) => {
        // Push result to results
        results.push (result);

        // Check results length
        if (results.length >= emission.count) {
          // Resolve results
          resolve (results);
        }
      }, true);

      // Emit event
      this.eden.emit (`${this._prefix}.endpoint.event.${event}`, emission, true);
    });
  }

  /**
   * Create endpoint for a given event
   *
   * @param {String}   event
   * @param {Function} fn
   */
  async endpoint (event, fn) {
    // Emit endpoint add
    await this.eden.call (`${this._prefix}.endpoint.add`, event, true);

    // Set on event
    this.eden.on (`${this._prefix}.endpoint.event.${event}`, async (emission) => {
      // Emit function result
      this.eden.emit (emission.id, await fn (...emission.args), true);
    }, true);
  }

}

/**
 * Export new Event Helper instance
 *
 * @type {EventHelper}
 */
exports = module.exports = new EventHelper ();
