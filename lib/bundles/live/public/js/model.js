
// Require dependencies
const uuid   = require('uuid');
const events = require('events');

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
    this.__id   = object.id;
    this.__data = object;
    this.__type = type;

    // Bind methods
    this.get     = this.get.bind(this);
    this.build   = this.build.bind(this);
    this.refresh = this.refresh.bind(this);
    this.destroy = this.destroy.bind(this);

    // Bind private methods
    this._update = this._update.bind(this);

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
    return this.__data[key];
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
   */
  async destroy () {
    // Await building
    await this.building;

    // Check loading
    if (!socket) return;

    // Call eden
    await socket.call('live.deafen.' + this.__type, this.__id, this.__uuid);

    // Add on event
    socket.off('live.update.' + this.__type + '.' + this.__id, this._update);
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
    let object = await socket.call('live.refresh.' + this.__type, this.__id);

    // Run update
    this._update(object);
  }

  /**
   * Listens to model by id
   */
  async listen () {
    // Await building
    await this.building;

    // Check loading
    if (!socket) return;

    // Set uuid
    if (!this.__uuid) this.__uuid = uuid();

    // Call eden
    await socket.call('live.listen.' + this.__type, this.__id, this.__uuid);

    // Add on event
    socket.on('live.update.' + this.__type + '.' + this.__id, this._update);
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
}

/**
 * Export live model class
 *
 * @type {model}
 */
exports = module.exports = model;
