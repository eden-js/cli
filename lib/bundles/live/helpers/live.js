
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
   * @param  {Request} req
   * @param  {*}       Model
   *
   * @returns {Promise}
   */
  deafen (req, Model) {
    // call local
    return this.eden.call ('live.deafen', Model.constructor.name, Model.get ('_id').toString (), req.sessionID);
  }

  /**
   * live listens to model
   *
   * @param  {Request} req
   * @param  {*}       Model
   *
   * @returns {Promise}
   */
  listen (req, Model) {
    // call local
    return this.eden.call ('live.listen', Model.constructor.name, Model.get ('_id').toString (), req.sessionID);
  }
}

/**
 * export live helper
 *
 * @type {liveHelper}
 */
exports = module.exports = new liveHelper ();
