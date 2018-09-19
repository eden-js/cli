
// Require helper
const helper = require('helper');

/**
 * Create model helper
 *
 * @extends helper
 */
class ModelHelper extends helper {

  /**
   * Construct model helper
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
    return this.eden.thread('compute', 0).call('model.deafen', sessionID, Model.constructor.name.toLowerCase(), Model.get('_id').toString(), listenID);
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
    return this.eden.thread('compute', 0).call('model.listen', sessionID, Model.constructor.name.toLowerCase(), Model.get('_id').toString(), listenID);
  }
}

/**
 * Export model helper
 *
 * @type {ModelHelper}
 */
exports = module.exports = new ModelHelper();
