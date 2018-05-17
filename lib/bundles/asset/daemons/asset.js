// Require dependencies
const fs = require('fs-extra');

// Require local dependencies
const config = require('config');

// Require local class dependencies
const Daemon = require('daemon');

// Require transports
const LocalTransport = require('asset/transports/local');

// Require models
const File  = model('file');
const Image = model('image');

/**
 * Create Asset Daemon class
 *
 * @compute
 * @express
 */
class AssetDaemon extends Daemon {

  /**
   * Construct Asset Daemon class
   */
  constructor () {
    // Run super
    super();

    // Bind methods
    this.build = this.build.bind(this);

    // Register transport
    this.eden.register('asset.transport', new LocalTransport());

    // Run build
    this.building = this.build();
  }

  /**
   * Builds Asset Daemon
   *
   * @async
   */
  async build () {
    // Check migration
    if (config.get('asset.migrate')) {
      // Load all file assets
      const files = await File.find();

      // Loop files
      files.forEach(this._migrate);

      // Load all image assets
      const images = await Image.find();

      // Loop images
      images.forEach(this._migrate);
    }
  }

  /**
   * Migrates asset
   *
   * @param {File} asset
   *
   * @async
   */
  async _migrate (asset) {
    // Check file exists
    if (fs.existsSync(global.appRoot + '/www/public/' + asset.get('path') + '/' + asset.get('hash') + asset.get('ext'))) {
      // Create asset from file
      await asset.fromFile(global.appRoot + '/www/public/' + asset.get('path') + '/' + asset.get('hash') + asset.get('ext'), asset.get('name'));
    }

    // Set ext
    asset.set('ext', asset.get('ext').replace('.', ''));

    // Unset unused properties
    asset.unset('sub');
    asset.unset('dir');

    // Save asset
    await asset.save();
  }

}

/**
 * Export Asset Daemon class
 *
 * @type {AssetDaemon}
 */
exports = module.exports = AssetDaemon;
