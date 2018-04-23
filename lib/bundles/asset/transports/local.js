
// require base
const fs   = require ('fs-extra');
const base = require ('base');

/**
 * extend base
 *
 * @extends base
 */
class localTransport extends base {

  /**
   * construct this
   */
  constructor () {
    // construct super
    super (...arguments);

  }

  /**
   * gets asset url
   *
   * @param  {asset}  Asset
   * @param  {String} label
   *
   * @return {*}
   */
  url (Asset, label) {
    // return url
    return '/public/media/' + Asset.get ('path') + '/' + (label || 'full.' + Asset.get ('ext'));
  }

  /**
   * pushes asset to storage
   *
   * @param  {asset}  Asset
   * @param  {String} tmp
   * @param  {String} label
   */
  async push (Asset, tmp, label) {
    // set transport
    Asset.set ('transport', 'local');

    // get date
    let date = Asset.get ('created_at') || new Date ();

    // augment date
    date = date.getFullYear () + '-' + (date.getMonth () + 1) + '-' + date.getDate ();

    // set path
    Asset.set ('path', date + '/' + Asset.get ('hash'));

    // ensure sync
    await fs.ensureDir (global.appRoot + '/www/public/media/' + Asset.get ('path'));

    // pushes asset
    await fs.copy (tmp, global.appRoot + '/www/public/media/' + Asset.get ('path') + '/' + (label || 'full.' + Asset.get ('ext')));
  }

  /**
   * pulls asset from storage
   *
   * @param  {asset}  Asset
   * @param  {String} tmp
   * @param  {String} label
   */
  async pull (Asset, tmp, label) {
    // set transport
    Asset.set ('transport', 'local');

    // pushes asset
    await fs.copy (global.appRoot + '/www/public/media/' + Asset.get ('path') + '/' + (label || 'full.' + Asset.get ('ext')), tmp);
  }

  /**
   * removes asset from storage
   *
   * @param  {asset} Asset
   * @param  {String} label
   */
  async remove (Asset, label) {
    // pushes asset
    await fs.unlink (global.appRoot + '/www/public/media/' + Asset.get ('path') + '/' + (label || 'full.' + Asset.get ('ext')));

    // count files in directory
    if (!(await fs.readdir (global.appRoot + '/www/public/media/' + Asset.get ('path'))).files.length) {
      // remove directory
      await fs.unlink (global.appRoot + '/www/public/media/' + Asset.get ('path'));
    }
  }
}

/**
 * export local transport class
 *
 * @type {localTransport}
 */
exports = module.exports = localTransport;
