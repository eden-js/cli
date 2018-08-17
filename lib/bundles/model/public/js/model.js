// Require dependencies
const uuid    = require('uuid');
const events  = require('events');
const dotProp = require('dot-prop-immutable');

// global vars
let socket = null;

/**
 * Create live model class
 *
 * @extends events
 */
class model extends events {

  /**
   * Construct model class
   *
   * @param {String} type
   * @param {Object} object
   */
  constructor (type, object) {
    // Run super
    super();

    // Set id
    this.__id    = object.id;
    this.__data  = object;
    this.__type  = type;
    this.__queue = [];

    // Bind methods
    this.get     = this.get.bind(this);
    this.build   = this.build.bind(this);
    this.listen  = this.listen.bind(this);
    this.refresh = this.refresh.bind(this);
    this.destroy = this.destroy.bind(this);

    // Bind private methods
    this._update  = this._update.bind(this);
    this._connect = this._connect.bind(this);

    // Build
    this.building = this.build();
  }

  /**
   * Returns data key
   *
   * @param  {String} key
   *
   * @return {*}
   */
  get (key) {
    // Check key
    if (!key || !key.length) return this.__data;

    // Return this key
    return dotProp.get(this.__data, key);
  }

  /**
   * Builds this
   */
  async build () {
    // Check if window
    if (typeof window !== 'undefined') socket = require('socket/public/js/bootstrap');

    // Listen
    await this.listen();
  }

  /**
   * Listens to model by id
   *
   * @return {Promise}
   */
  async destroy () {
    // Await building
    await this.building;

    // Check listening
    await Promise.all(this.__queue);

    // Check loading
    if (!socket || !this.__isListening) return;

    // Create new promise
    let promise = new Promise(async (resolve) => {
      // Call eden
      await socket.call('model.deafen.' + this.__type, this.__id, this.__uuid);

      // Set listen
      this.__isListening = false;

      // Add on event
      socket.off('model.update.' + this.__type + '.' + this.__id, this._update);

      // Listen to connect again
      socket.off('connect', this._connect);

      // Resolve
      resolve();
    });

    // Add to queue
    this.__queue.push(promise);

    // Return await deafening
    return await promise;
  }

  /**
   * Refreshes this
   */
  async refresh () {
    // Await building
    await this.building;

    // Check loading
    if (!socket) return;

    // Call eden
    let object = await socket.call('model.refresh.' + this.__type, this.__id);

    // Run update
    this._update(object);
  }

  /**
   * Listens to model by id
   *
   * @return {Promise}
   */
  async listen () {
    // Await building
    await this.building;

    // Check listening
    await Promise.all(this.__queue);

    // Check loading
    if (!socket || this.__isListening) return;

    // Set uuid
    if (!this.__uuid) this.__uuid = uuid();

    // Create new promise
    let promise = new Promise(async (resolve) => {
      // Call eden
      await socket.call('model.listen.' + this.__type, this.__id, this.__uuid);

      // Set listen
      this.__isListening = true;

      // Add on event
      socket.on('model.update.' + this.__type + '.' + this.__id, this._update);

      // Listen to connect again
      socket.on('connect', this._connect);

      // Resolve
      resolve();
    });

    // Add to queue
    this.__queue.push(promise);

    // Return listening promise
    return await promise;
  }

  /**
   * On update
   *
   * @param  {Object} object
   */
  _update (object) {
    // Update details
    for (let key in object) {
      // Check differences
      if (this.__data[key] !== object[key]) {
        // Listen to object key
        this.__data[key] = object[key];

        // Emit event
        this.emit(key, object[key]);
      }
    }

    // Emit update
    this.emit('update');
  }

  /**
   * On socket reconnect
   */
  _connect () {
    // Reconnected
    if (this.__isListening) {
      // Call live listen again
      socket.call('model.listen.' + this.__type, this.__id, this.__uuid);
    }
  }
}

/**
 * Export live model class
 *
 * @type {model}
 */
exports = module.exports = model;
