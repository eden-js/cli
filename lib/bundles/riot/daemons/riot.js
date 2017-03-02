/**
 * Created by Alex.Taylor on 26/02/2016.
 */


// require dependencies
const riot   = require ('riot');
const path   = require ('path');
const daemon = require ('daemon');

/**
 * build riot dameon class
 *
 * @express
 */
class riotDaemon extends daemon {
  /**
   * construct riot daemon class
   *
   * @param {eden} eden
   */
  constructor () {
    // run super eden
    super ();

    // require tags
    require ('app/cache/tags.js');

    // on render
    this.eden.pre ('view.compile', (render) => {
      // alter mount page
      render.mount.page = render.mount.page.split ('views/')[1].split (path.sep).join ('-').trim ().replace ('.tag', '') + '-page';

      // alter mount layout
      render.mount.layout = render.mount.layout + '-layout';
    });

    // set eden view
    this.eden.view = this.render;
  }

  /**
   * renders page view
   *
   * @param {Options} opts
   *
   * @return {String}
   */
  async render (opts) {
    // render page
    return riot.render (opts.mount.layout, opts);
  }
}

/**
 * export riot daemon class
 *
 * @type {riotDaemon}
 */
exports = module.exports = riotDaemon;
