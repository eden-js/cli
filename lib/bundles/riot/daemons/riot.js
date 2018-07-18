
// Require dependencies
const riot   = require('riot');
const path   = require('path');
const daemon = require('daemon');

/**
 * Build riot dameon class
 *
 * @compute
 * @express
 */
class riotDaemon extends daemon {

  /**
   * Construct riot daemon class
   *
   * @param {eden} eden
   */
  constructor () {
    // Run super
    super();

    // Require tags
    require('app/cache/tags');
    require('app/cache/emails');

    // On render
    this.eden.pre('view.compile', (render) => {
      // Alter mount page
      render.mount.page = render.mount.page.split('views')[1].substr(path.sep.length).split(path.sep).join('-').trim().replace('.tag', '') + '-page';

      // Alter mount layout
      render.mount.layout = render.mount.layout + '-layout';
    });

    // Set eden view
    this.eden.view  = this.render;
    this.eden.email = this.email;
  }

  /**
   * Renders page view
   *
   * @param {Options} opts
   *
   * @return {String}
   */
  render (opts) {
    // Render page
    return riot.render(opts.mount.layout, opts);
  }

  /**
   * Render email template
   *
   * @param  {String} template
   * @param  {Options} options
   *
   * @return Promise
   */
  email (template, options) {
    // Return render
    return riot.render(template + '-email', options);
  }
}

/**
 * Export riot daemon class
 *
 * @type {riotDaemon}
 */
exports = module.exports = riotDaemon;
