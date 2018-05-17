
// Require events
const uuid   = require('uuid');
const events = require('events');

/**
 * Build eden worker class
 *
 * @extends events
 */
class edenWorker extends events {

  /**
   * Construct eden worker
   */
  constructor () {
    // Run super
    super(...arguments);

    // Bind methods
    this.can   = this.can.bind(this);
    this.build = this.build.bind(this);

    // Run build method
    this.building = this.build();
  }

  /**
   * Builds eden service worker
   */
  async build () {
    // Check can
    if (!this.can()) return;

    // Registered successfully
    console.log('[EdenJS] [ServiceWorker] registering serviceWorker');

    // Register serviceworker
    this.registration = await navigator.serviceWorker.register('/sw.js');
    this.ready        = await navigator.serviceWorker.ready;

    // Await subscription
    this.subscription = await this.ready.pushManager.getSubscription();

    // Create message channel
    this.channel = new MessageChannel();

    // Emit on message
    this.channel.port1.onmessage = (event) => {
      // On message
      this.emit(event.data.type, ...event.data.args);
    };

    // Registered successfully
    console.log('[EdenJS] [ServiceWorker] registration successful with scope: ', this.registration.scope);
  }

  /**
   * Calls name and data
   *
   * @param  {String} name
   * @params {*} args
   *
   * @return {Promise}
   */
  async call (name, ...args) {
    // Let id
    let id = uuid();

    // Create emission
    let emission = {
      'id'   : id,
      'args' : args,
      'name' : name
    };

    // Await one response
    let result = new Promise((resolve) => {
      // On message
      this.once(id, resolve);
    });

    // Emit to socket
    this.send('serviceworker.call.' + name, emission);

    // Return result
    return await result;
  }

  /**
   * Sends message to serviceWorker
   *
   * @param  {String} type
   * @param  {Array}  args
   */
  async send (type, ...args) {
    // Await building
    await this.building;

    // Push to message channel
    this.registration.active.postMessage({
      'type' : type,
      'args' : args 
    }, [this.channel.port2]);
  }

  /**
   * Returns can create service worker
   *
   * @return {Boolean}
   */
  can () {
    // Return can
    return !!('serviceWorker' in navigator && navigator.serviceWorker);
  }
}

/**
 * Create new eden worker
 *
 * @type {edenWorker}
 */
exports = module.exports = window.eden.serviceworker = new edenWorker();
