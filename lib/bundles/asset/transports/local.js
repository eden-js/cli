// Require dependencies
const fs = require ('fs-extra');

// Require local class dependencies
const Base = require ('base');

/**
 * Create Local Transport class
 */
class LocalTransport extends Base {

  /**
   * Construct Local Transport class
   */
  constructor () {
    // Run super
    super ();
  }

  /**
   * Gets Asset url
   *
   * @param  {Asset}  asset
   * @param  {String} label
   *
   * @return {*}
   */
  url (asset, label) {
    // Return url
    return '/public/media/' + asset.get ('path') + '/' + (label || 'full.' + asset.get ('ext'));
  }

  /**
   * Pushes Asset to storage
   *
   * @param {Asset}  asset
   * @param {String} tmp
   * @param {String} label
   */
  async push (asset, tmp, label) {
    // Set transport
    asset.set ('transport', 'local');

    // Get date
    let date = asset.get ('created_at') || new Date ();

    // Augment date
    date = date.getFullYear () + '-' + (date.getMonth () + 1) + '-' + date.getDate ();

    // Set path
    asset.set ('path', date + '/' + asset.get ('hash'));

    // Ensure sync
    await fs.ensureDir (global.appRoot + '/www/public/media/' + asset.get ('path'));

    // Pushes asset
    await fs.copy (tmp, global.appRoot + '/www/public/media/' + asset.get ('path') + '/' + (label || 'full.' + asset.get ('ext')));
  }

  /**
   * Pulls Asset from storage
   *
   * @param {Asset}  asset
   * @param {String} tmp
   * @param {String} label
   */
  async pull (asset, tmp, label) {
    // Set transport
    asset.set ('transport', 'local');

    // Pushes asset
    await fs.copy (global.appRoot + '/www/public/media/' + asset.get ('path') + '/' + (label || 'full.' + asset.get ('ext')), tmp);
  }

  /**
   * Removes Asset from storage
   *
   * @param {Asset} asset
   * @param {String} label
   */
  async remove (asset, label) {
    // Pushes asset
    await fs.unlink (global.appRoot + '/www/public/media/' + asset.get ('path') + '/' + (label || 'full.' + asset.get ('ext')));

    // Count files in directory
    if (!(await fs.readdir (global.appRoot + '/www/public/media/' + asset.get ('path'))).files.length) {
      // Remove directory
      await fs.unlink (global.appRoot + '/www/public/media/' + asset.get ('path'));
    }
  }
}

/**
 * Export Local Transport class
 *
 * @type {LocalTransport}
 */
exports = module.exports = LocalTransport;
