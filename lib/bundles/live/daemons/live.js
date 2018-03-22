
// require daemon
const daemon = require ('daemon');

// require helpers
const socket = helper ('socket');

/**
 * create live daemon
 *
 * @compute 0
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
    this.eden.endpoint ('live.listen', this._listen, true);
    this.eden.endpoint ('live.deafen', this._deafen, true);

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

    // log to eden
    this.logger.log ('debug', 'sending live response on ' + opts.model + ' #' + opts.id, {
      'class' : 'liveDaemon'
    });

    // get model
    let Model = model (opts.model);

    // load by id
    Model = await Model.findById (opts.id);

    // emit sanitised
    let sanitised = await Model.sanitise ();

    // loop listeners
    listeners.forEach ((listener) => {
      // emit to socket
      socket.session (listener.session, 'live.update.' + opts.model + '.' + opts.id, sanitised);
    });
  }

  /**
   * listen to endpoint for live data
   *
   * @param  {String}  sessionID
   * @param  {String}  type
   * @param  {String}  id
   * @param  {String}  listenID
   */
  async _deafen (sessionID, type, id, listenID) {
    // log to eden
    this.logger.log ('debug', 'removing live listener on ' + type + ' #' + id + ' for ' + sessionID, {
      'class' : 'liveDaemon'
    });

    // lock listen
    let unlock = await this.eden.lock ('live.listen.' + type + '.' + id);

    // set cache
    let listeners = await this.eden.get ('live.listen.' + type + '.' + id) || [];

    // add sessionID to listeners
    listeners = listeners.filter ((listener) => {
      // return filtered
      return listener.session !== sessionID && listener.uuid !== listenID;
    });

    // set to eden again
    await this.eden.set ('live.listen.' + type + '.' + id, listeners, 60 * 60 * 1000);

    // unlock live listen set
    unlock ();
  }

  /**
   * listen to endpoint for live data
   *
   * @param  {String}  sessionID
   * @param  {String}  type
   * @param  {String}  id
   * @param  {String}  listenID
   */
  async _listen (sessionID, type, id, listenID) {
    // log to eden
    this.logger.log ('debug', 'adding live listener on ' + type + ' #' + id + ' for ' + sessionID, {
      'class' : 'liveDaemon'
    });

    // lock listen
    let unlock = await this.eden.lock ('live.listen.' + type + '.' + id);

    // set cache
    let listeners = await this.eden.get ('live.listen.' + type + '.' + id) || [];

    // add sessionID to listeners
    if (!listeners.find ((listener) => {
      // return filtered
      return listener.session === sessionID && listener.uuid === listenID;
    })) listeners.push ({
      'uuid'    : listenID,
      'session' : sessionID
    });

    // set to eden again
    await this.eden.set ('live.listen.' + type + '.' + id, listeners, 60 * 60 * 1000);

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
