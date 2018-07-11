
// Require local dependencies
const riot   = require('riot');
const store  = require('default/public/js/store');
const events = require('events');

// Require tags
require('app/cache/tags.min');

// Add riot to window
window.riot = riot;

/**
 * Build riot frontend class
 */
class riotFrontend extends events {

  /**
   * Construct riot frontend
   */
  constructor () {
    // Run super
    super(...arguments);

    // Bind methods
    this._mount  = this._mount.bind(this);
    this._layout = this._layout.bind(this);

    // Frontend hooks
    store.on('layout',     this._layout);
    store.on('initialize', this._mount);
  }

  /**
   * Mounts frontend
   *
   * @param {Object} state
   */
  _mount (state) {
    // Mount riot tag
    this._mounted = riot.mount(document.querySelector('body').children[0], state)[0];
  }

  /**
   * Checks for correct layout
   *
   * @param  {Object} state
   *
   * @private
   * @return {Boolean}
   */
  _layout (state) {
    // Set layout variable
    let layout = (state.mount.layout || 'main-layout');

    // Get current layout
    let current = document.querySelector('body').children[0];

    // Check if layout needs replacing
    if (current.tagName.toLowerCase() === layout.toLowerCase()) {
      return false;
    }

    // Unmount tag
    this._mounted.unmount(true);

    // Replace with
    jQuery(current).replaceWith(document.createElement(layout));

    // Add c;ass
    jQuery(document.querySelector('body').children[0]).addClass('eden-layout');

    // Mount new tag
    this._mounted = riot.mount(document.querySelector('body').children[0], state)[0];

    // Return true
    state.mounted = true;
  }
}

/**
 * Export new riot frontend function
 *
 * @return {riotFrontend}
 */
exports = module.exports = window.eden.riot = new riotFrontend();
