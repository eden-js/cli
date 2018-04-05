
// require events
const events = require ('events');

/**
 * build edenWorker eden
 *
 * @extends events
 */
class edenWorker extends events {

  /**
   * construct eden
   */
  constructor () {
    // run super
    super (...arguments);

    // bind methods
    this.send     = this.send.bind (this);
    this.build    = this.build.bind (this);
    this.endpoint = this.endpoint.bind (this);

    // build this
    this.building = this.build ();
  }

  /**
   * builds eden worker
   */
  build () {
    // registered successfully
    console.log ('[edenWorker] building serviceWorker');

    // emit on message
    self.addEventListener ('message', (event) => {
      // on message
      this.emit (event.data.type, event.ports[0], ...event.data.args);
    });
  }

  /**
   * sends message to serviceWorker
   *
   * @param  {*}      port
   * @param  {String} type
   * @param  {Array}  args
   */
  async send (port, type, ...args) {
    // await building
    await this.building;

    // push to message channel
    port.postMessage ({ type, args });
  }

  /**
   * create RPC endpoint
   *
   * @param  {String}   str
   * @param  {Function} fn
   */
  endpoint (str, fn) {
    // on connect call
    this.on ('serviceworker.call.' + str, async (port, { id, args }) => {
      // run function
      this.send (port, id, await fn (...args));
    });
  }
}

/**
 * create edenWorker
 *
 * @type {edenWorker}
 */
self.eden = new edenWorker ();
