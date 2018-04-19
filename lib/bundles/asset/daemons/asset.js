
// require dependencies
const daemon = require ('daemon');

// require transport
const localTransport = require ('asset/transports/local');

/**
 * build asset dameon class
 *
 * @compute
 * @express
 */
class assetDaemon extends daemon {

  /**
   * construct asset daemon class
   */
  constructor () {
    // run super eden
    super (...arguments);

    // register transport
    this.eden.register ('asset.transport', new localTransport ());
  }

}

/**
 * export asset daemon class
 *
 * @type {asset}
 */
exports = module.exports = assetDaemon;
