
// require helper
const helper = require ('helper');

/**
 * create live helper
 *
 * @extends helper
 */
class liveHelper extends helper {

  /**
   * construct live helper
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.deafen = this.deafen.bind (this);
    this.listen = this.listen.bind (this);
  }

  /**
   * live listens to model
   *
   * @param  {String} sessionID
   * @param  {*}      Model
   * @param  {String} listenID
   *
   * @returns {Promise}
   */
  deafen (sessionID, Model, listenID) {
    // call local
    return this.eden.call ('live.deafen', sessionID, Model.constructor.name, Model.get ('_id').toString (), listenID);
  }

  /**
   * live listens to model
   *
   * @param  {String} sessionID
   * @param  {*}      Model
   * @param  {String} listenID
   *
   * @returns {Promise}
   */
  listen (sessionID, Model, listenID) {
    // call local
    return this.eden.call ('live.listen', sessionID, Model.constructor.name, Model.get ('_id').toString (), listenID);
  }
}

/**
 * export live helper
 *
 * @type {liveHelper}
 */
exports = module.exports = new liveHelper ();
