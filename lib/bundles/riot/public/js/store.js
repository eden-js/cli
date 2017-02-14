
// require dependencies
const riot = require ('riot');

/**
 * create riot store
 */
class riotStore {
  /**
   * construct riot store
   */
  constructor () {
    // set observable
    riot.observable (this);

    // check window
    if (typeof window === 'undefined') return;

    // set variables
    for (var key in window.eden) {
      // set value
      this[key] = window.eden[key];
    }
  }

  /**
   * sets key values
   *
   * @param  {String} key
   * @param  {*} val
   *
   * @return {this}
   */
  set (key, val) {
    // set to this
    this[key] = val;

    // emit to this
    this.trigger (key, val);

    // return this
    return this;
  }

  /**
   * gets key values
   *
   * @param  {String} key
   *
   * @return {*}
   */
  get (key) {
    // return this
    return this[key];
  }
}

/**
 * export built riot store
 *
 * @type {riotStore}
 */
module.exports = new riotStore ();
