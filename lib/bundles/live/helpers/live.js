
// Require helper
const helper = require('helper');

/**
 * Create live helper
 *
 * @extends helper
 */
class liveHelper extends helper {

  /**
   * Construct live helper
   */
  constructor () {
    // Run super
    super();

    // Bind methods
    this.deafen = this.deafen.bind(this);
    this.listen = this.listen.bind(this);
  }

  /**
   * Live listens to model
   *
   * @param  {String} sessionID
   * @param  {*}      Model
   * @param  {String} listenID
   *
   * @returns {Promise}
   */
  deafen (sessionID, Model, listenID) {
    // Call local
    return this.eden.call('live.deafen', sessionID, Model.constructor.name, Model.get('_id').toString(), listenID, true);
  }

  /**
   * Live listens to model
   *
   * @param  {String} sessionID
   * @param  {*}      Model
   * @param  {String} listenID
   *
   * @returns {Promise}
   */
  listen (sessionID, Model, listenID) {
    // Call local
    return this.eden.call('live.listen', sessionID, Model.constructor.name, Model.get('_id').toString(), listenID, true);
  }
}

/**
 * Export live helper
 *
 * @type {liveHelper}
 */
exports = module.exports = new liveHelper();
