
// require dependencies
const fs     = require ('fs-extra');
const config = require ('config');
const daemon = require ('daemon');

// require transport
const localTransport = require ('asset/transports/local');

// models
const file  = model ('file');
const image = model ('image');

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

    // bind methods
    this.build = this.build.bind (this);

    // register transport
    this.eden.register ('asset.transport', new localTransport ());

    // run build
    this.building = this.build ();
  }

  /**
   * builds asset daemon
   */
  async build () {
    // check migration
    if (config.get ('asset.migrate')) {
      // load all assets
      let Files = await file.find ();

      // loop files
      Files.forEach (this._migrate);

      // load all assets
      let Images = await image.find ();

      // loop files
      Images.forEach (this._migrate);
    }
  }

  /**
   * migrates asset
   *
   * @param  {file}  Asset
   */
  async _migrate (Asset) {
    // check file exists
    if (fs.existsSync (global.appRoot + '/www/public/' + Asset.get ('path') + '/' + Asset.get ('hash') + Asset.get ('ext'))) {
      // await file
      await Asset.fromFile (global.appRoot + '/www/public/' + Asset.get ('path') + '/' + Asset.get ('hash') + Asset.get ('ext'), Asset.get ('name'));
    }

    // set ext
    Asset.set ('ext', Asset.get ('ext').replace ('.', ''));
    Asset.unset ('sub');
    Asset.unset ('dir');

    // save asset
    await Asset.save ();
  }

}

/**
 * export asset daemon class
 *
 * @type {asset}
 */
exports = module.exports = assetDaemon;
