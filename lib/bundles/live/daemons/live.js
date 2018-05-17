
// Require daemon
const daemon = require('daemon');

// Require helpers
const socket = helper('socket');

/**
 * Create live daemon
 *
 * @compute 0
 * @extends daemon
 */
class liveDaemon extends daemon {

  /**
   * Constructor
   */
  constructor () {
    // Run arguments
    super(...arguments);

    // Bind build
    this.build = this.build.bind(this);

    // Bind private methods
    this._save   = this._save.bind(this);
    this._deafen = this._deafen.bind(this);
    this._listen = this._listen.bind(this);

    // Bind building
    this.building = this.build();
  }

  /**
   * Build live daemon
   */
  build () {
    // Add endpoint for listen
    this.eden.endpoint('live.listen', this._listen, true);
    this.eden.endpoint('live.deafen', this._deafen, true);

    // Add listeners for events
    this.eden.on('model.save', this._save, true);
  }

  /**
   * On model save
   * @param  {Object}  opts
   */
  async _save (opts) {
    // Get cache
    let listeners = await this.eden.get('live.listen.' + opts.model + '.' + opts.id) || [];

    // Check length
    if (!listeners.length) return;

    // Log to eden
    this.logger.log('debug', 'sending live response on ' + opts.model + ' #' + opts.id, {
      'class' : 'liveDaemon'
    });

    // Get model
    let Model = model(opts.model);

    // Load by id
    Model = await Model.findById(opts.id);

    // Emit sanitised
    let sent      = [];
    let sanitised = await Model.sanitise();

    // Loop listeners
    listeners.forEach((listener) => {
      // Emit to socket
      if (!sent.includes(listener.session)) socket.session(listener.session, 'live.update.' + opts.model + '.' + opts.id, sanitised);

      // Push to sent
      sent.push(listener.session);
    });
  }

  /**
   * Listen to endpoint for live data
   *
   * @param  {String}  sessionID
   * @param  {String}  type
   * @param  {String}  id
   * @param  {String}  listenID
   */
  async _deafen (sessionID, type, id, listenID) {
    // Log to eden
    this.logger.log('debug', 'removing live listener on ' + type + ' #' + id + ' for ' + sessionID, {
      'class' : 'liveDaemon'
    });

    // Lock listen
    let unlock = await this.eden.lock('live.listen.' + type + '.' + id);

    // Set cache
    let listeners = await this.eden.get('live.listen.' + type + '.' + id) || [];

    // Add sessionID to listeners
    listeners = listeners.filter((listener) => {
      // Return filtered
      return listener.session !== sessionID && listener.uuid !== listenID;
    });

    // Set to eden again
    await this.eden.set('live.listen.' + type + '.' + id, listeners, 60 * 60 * 1000);

    // Unlock live listen set
    unlock();
  }

  /**
   * Listen to endpoint for live data
   *
   * @param  {String}  sessionID
   * @param  {String}  type
   * @param  {String}  id
   * @param  {String}  listenID
   */
  async _listen (sessionID, type, id, listenID) {
    // Log to eden
    this.logger.log('debug', 'adding live listener on ' + type + ' #' + id + ' for ' + sessionID, {
      'class' : 'liveDaemon'
    });

    // Lock listen
    let unlock = await this.eden.lock('live.listen.' + type + '.' + id);

    // Set cache
    let listeners = await this.eden.get('live.listen.' + type + '.' + id) || [];

    // Add sessionID to listeners
    if (!listeners.find((listener) => {
      // Return filtered
      return listener.session === sessionID && listener.uuid === listenID;
    })) listeners.push({
      'uuid'    : listenID,
      'session' : sessionID
    });

    // Set to eden again
    await this.eden.set('live.listen.' + type + '.' + id, listeners, 60 * 60 * 1000);

    // Unlock live listen set
    unlock();
  }

}

/**
 * Build live daemon class
 *
 * @type {liveDaemon}
 */
exports = module.exports = liveDaemon;
