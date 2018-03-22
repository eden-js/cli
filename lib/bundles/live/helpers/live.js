
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
   *
   * @returns {Promise}
   */
  deafen (sessionID, Model) {
    // call local
    return this.eden.call ('live.deafen', Model.constructor.name, Model.get ('_id').toString (), sessionID);
  }

  /**
   * live listens to model
   *
   * @param  {String} sessionID
   * @param  {*}      Model
   *
   * @returns {Promise}
   */
  listen (sessionID, Model) {
    // call local
    return this.eden.call ('live.listen', Model.constructor.name, Model.get ('_id').toString (), sessionID);
  }
}

/**
 * export live helper
 *
 * @type {liveHelper}
 */
exports = module.exports = new liveHelper ();
