// require dependencies
const uuid = require ('uuid');

// require local dependencies
const helper = require ('helper');

/**
 * create event helper class
 */
class eventHelper extends helper {

  /**
   * construct event helper class
   */
  constructor () {
    // run super
    super ();

    // bind private variables
    this._prefix = 'eden.events.daemon';

    // bind public methods
    this.call     = this.call.bind (this);
    this.endpoint = this.endpoint.bind (this);
  }

  /**
   * call a given event with the given args
   *
   * @param {String} event
   * @param {Array}  args
   *
   * @returns {Promise<Array>}
   */
  async call (event, ...args) {
    // set emission
    const emission = {
      'id'    : uuid (),
      'event' : event,
      'count' : await this.eden.call (`${this._prefix}.endpoint.count`, event, true),
      'args'  : args || []
    };

    // create result promise
    return new Promise ((resolve) => {
      // set results
      const results = [];

      // set on event
      this.eden.on (emission.id, (result) => {
        // push result to results
        results.push (result);

        // check results length
        if (results.length >= emission.count) {
          // resolve results
          resolve (results);
        }
      }, true);

      // emit event
      this.eden.emit (`${this._prefix}.endpoint.event.${event}`, emission, true);
    });
  }

  /**
   * create endpoint for a given event
   *
   * @param {String}   event
   * @param {Function} fn
   */
  async endpoint (event, fn) {
    // emit endpoint add
    await this.eden.call (`${this._prefix}.endpoint.add`, event, true);

    // set on event
    this.eden.on (`${this._prefix}.endpoint.event.${event}`, async (emission) => {
      // emit function result
      this.eden.emit (emission.id, await fn (...emission.args), true);
    }, true);
  }

}

/**
 * export event helper instance
 *
 * @type {eventHelper}
 */
exports = module.exports = new eventHelper ();
