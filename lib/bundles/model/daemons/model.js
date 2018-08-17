// Require daemon
const daemon = require('daemon');

// Require helpers
const socket = helper('socket');

/**
 * Create live daemon
 *
 * @compute
 * @extends daemon
 */
class modelDaemon extends daemon {

  /**
   * Constructor
   */
  constructor () {
    // Run arguments
    super(...arguments);

    // Bind build
    this.build = this.build.bind(this);

    // Bind private methods
    this._save    = this._save.bind(this);
    this._deafen  = this._deafen.bind(this);
    this._listen  = this._listen.bind(this);
    this._collect = this._collect.bind(this);

    // Bind building
    this.building = this.build();
  }

  /**
   * Build live daemon
   */
  build () {
    // Add endpoint for listen
    this.eden.endpoint('model.listen', this._listen, true);
    this.eden.endpoint('model.deafen', this._deafen, true);

    // Add listeners for events
    this.eden.on('model.save', this._save, true);

    // Set interval for garbage collection
    setInterval(this._collect, 30 * 1000);
  }

  /**
   * On model save
   * @param  {Object}  opts
   */
  async _save (opts) {
    // Get cache
    let listeners = await this.eden.get('model.listen.' + opts.model.toLowerCase() + '.' + opts.id) || [];

    // Check length
    if (!listeners.length) return;

    // Log to eden
    this.logger.log('debug', 'Sending live response on ' + opts.model.toLowerCase() + ' #' + opts.id, {
      'class' : this.constructor.name
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
      if (!sent.includes(listener.session)) socket.session(listener.session, 'model.update.' + opts.model.toLowerCase() + '.' + opts.id, sanitised);

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
    this.logger.log('debug', 'removing model listener on ' + type + ' #' + id + ' for ' + sessionID, {
      'class' : 'modelDaemon'
    });

    // Lock listen
    let unlock = await this.eden.lock('model.listen.' + type + '.' + id);

    // Set cache
    let listeners = await this.eden.get('model.listen.' + type + '.' + id) || [];

    // Add sessionID to listeners
    listeners = listeners.filter((listener) => {
      // Return filtered
      return listener.session !== sessionID && listener.uuid !== listenID;
    });

    // Set to eden again
    await this.eden.set('model.listen.' + type + '.' + id, listeners, 60 * 60 * 1000);

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
    this.logger.log('debug', 'adding model listener on ' + type + ' #' + id + ' for ' + sessionID, {
      'class' : 'modelDaemon'
    });

    // Lock listen
    let unlock = await this.eden.lock('model.listen.' + type + '.' + id);

    // Set cache
    let listeners = await this.eden.get('model.listen.' + type + '.' + id) || [];

    // Check found
    let found = listeners.find((listener) => {
      // Return filtered
      return listener.session === sessionID && listener.uuid === listenID;
    });

    // Add sessionID to listeners
    if (found) {
      // Update date
      found.last = new Date();
    } else {
      // Push listener
      listeners.push({
        'uuid'    : listenID,
        'last'    : new Date(),
        'session' : sessionID
      });
    }

    // Set to eden again
    await this.eden.set('model.listen.' + type + '.' + id, listeners, 60 * 60 * 1000);

    // Unlock live listen set
    unlock();
  }

  /**
   * Removes all listeners
   */
  async _collect () {

  }
}

/**
 * Build live daemon class
 *
 * @type {modelDaemon}
 */
exports = module.exports = modelDaemon;
