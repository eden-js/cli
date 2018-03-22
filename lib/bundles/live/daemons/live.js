
// require daemon
const daemon = require ('daemon');

/**
 * create live daemon
 *
 * @compute 1
 * @extends daemon
 */
class liveDaemon extends daemon {

  /**
   * constructor
   */
  constructor () {
    // run arguments
    super (...arguments);

    // bind build
    this.build = this.build.bind (this);

    // bind private methods
    this._save   = this._save.bind (this);
    this._deafen = this._deafen.bind (this);
    this._listen = this._listen.bind (this);

    // bind building
    this.building = this.build ();
  }

  /**
   * build live daemon
   */
  build () {
    // add endpoint for listen
    this.eden.endpoint ('live.listen', this._listen);
    this.eden.endpoint ('live.deafen', this._deafen);

    // add listeners for events
    this.eden.on ('model.save', this._save, true);
  }

  /**
   * on model save
   * @param  {Object}  opts
   */
  async _save (opts) {
    // get cache
    let listeners = await this.eden.get ('live.listen.' + opts.model + '.' + opts.id) || [];

    // check length
    if (!listeners.length) return;

    // get model
    let Model = model (opts.model);

    // load by id
    Model = await Model.findById (opts.id);

    // emit sanitised
    let sanitised = await Model.sanitise ();

    // loop listeners
    listeners.forEach ((listener) => {
      // emit to socket
      this.eden.emit ('socket.session', {
        'type'    : 'live.update.' + opts.model + '.' + opts.id,
        'args'    : sanitised,
        'session' : listener
      }, true);
    });
  }

  /**
   * listen to endpoint for live data
   *
   * @param  {Object}  opts
   * @param  {String}  sessionID
   */
  async _deafen (opts, sessionID) {
    // lock listen
    let unlock = await this.eden.lock ('live.listen.' + opts.model + '.' + opts.id);

    // set cache
    let listeners = await this.eden.get ('live.listen.' + opts.model + '.' + opts.id) || [];

    // add sessionID to listeners
    listeners = listeners.filter ((listener) => {
      // return filtered
      return listener !== sessionID;
    });

    // set to eden again
    await this.eden.set ('live.listen.' + opts.model + '.' + opts.id, listeners);

    // unlock live listen set
    unlock ();
  }

  /**
   * listen to endpoint for live data
   *
   * @param  {Object}  opts
   * @param  {String}  sessionID
   */
  async _listen (opts, sessionID) {
    // lock listen
    let unlock = await this.eden.lock ('live.listen.' + opts.model + '.' + opts.id);

    // set cache
    let listeners = await this.eden.get ('live.listen.' + opts.model + '.' + opts.id) || [];

    // add sessionID to listeners
    if (listeners.indexOf (sessionID) === -1) listeners.push (sessionID);

    // set to eden again
    await this.eden.set ('live.listen.' + opts.model + '.' + opts.id, listeners);

    // unlock live listen set
    unlock ();
  }

}

/**
 * build live daemon class
 *
 * @type {liveDaemon}
 */
exports = module.exports = liveDaemon;
