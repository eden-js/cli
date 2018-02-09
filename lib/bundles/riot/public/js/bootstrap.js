
// require local dependencies
const riot   = require ('riot');
const store  = require ('default/public/js/store');
const events = require ('events');

// require tags
require ('app/cache/tags.min');


/**
 * build bootstrap class
 */
class riotFrontend extends events {
  /**
   * construct riot frontend
   */
  constructor () {
    // run super
    super (...arguments);

    // bind methods
    this._mount  = this._mount.bind (this);
    this._layout = this._layout.bind (this);

    // frontend hooks
    store.pre ('frontend.mount', this._mount);
  }

  /**
   * mounts frontend
   */
  _mount (state) {
    // mount riot tag
    this._mounted = riot.mount (document.querySelector ('body').children[0], state)[0];
  }

  /**
   * checks for correct layout
   *
   * @param  {Object} state
   *
   * @private
   * @return {Boolean}
   */
  _layout (state) {
    // set layout variable
    let layout = (state.mount.layout || 'main-layout');

    // get current layout
    let current = document.querySelector ('body').children[0];

    // check if layout needs replacing
    if (current.tagName.toLowerCase () === layout.toLowerCase ()) {
      return false;
    }

    // unmount tag
    this._mounted.unmount (true);

    // replace with
    jQuery (current).replaceWith (document.createElement (layout));

    // mount new tag
    this._mounted = riot.mount (document.querySelector ('body').children[0], state)[0];

    // return true
    state.mounted = true;
  }
}

/**
 * export new bootstrap function
 *
 * @return {bootstrap}
 */
exports = module.exports = window.eden.riot = new riotFrontend ();
