
// require events
const uuid   = require ('uuid');
const events = require ('events');

/**
 * build eden worker class
 *
 * @extends events
 */
class edenWorker extends events {

  /**
   * construct eden worker
   */
  constructor () {
    // run super
    super (...arguments);

    // bind methods
    this.can   = this.can.bind (this);
    this.build = this.build.bind (this);

    // run build method
    this.building = this.build ();
  }

  /**
   * builds eden service worker
   */
  async build () {
    // check can
    if (!this.can ()) return;

    // registered successfully
    console.log ('[EdenJS] [ServiceWorker] registering serviceWorker');

    // register serviceworker
    this.registration = await navigator.serviceWorker.register ('/sw.js');
    this.ready        = await navigator.serviceWorker.ready;

    // await subscription
    this.subscription = await this.ready.pushManager.getSubscription ();

    // create message channel
    this.channel = new MessageChannel ();

    // emit on message
    this.channel.port1.onmessage = (event) => {
      // on message
      this.emit (event.data.type, ...event.data.args);
    };

    // registered successfully
    console.log ('[EdenJS] [ServiceWorker] registration successful with scope: ', this.registration.scope);
  }

  /**
   * calls name and data
   *
   * @param  {String} name
   * @params {*} args
   *
   * @return {Promise}
   */
  async call (name, ...args) {
    // let id
    let id = uuid ();

    // create emission
    let emission = {
      'id'   : id,
      'args' : args,
      'name' : name
    };

    // await one response
    let result = new Promise ((resolve) => {
      // on message
      this.once (id, resolve);
    });

    // emit to socket
    this.send ('serviceworker.call.' + name, emission);

    // return result
    return await result;
  }

  /**
   * sends message to serviceWorker
   *
   * @param  {String} type
   * @param  {Array}  args
   */
  async send (type, ...args) {
    // await building
    await this.building;

    // push to message channel
    this.registration.active.postMessage ({ type, args }, [this.channel.port2]);
  }

  /**
   * returns can create service worker
   *
   * @return {Boolean}
   */
  can () {
    // return can
    return !!('serviceWorker' in navigator && navigator.serviceWorker);
  }
}

/**
 * create new eden worker
 *
 * @type {edenWorker}
 */
exports = module.exports = window.eden.serviceworker = new edenWorker ();
