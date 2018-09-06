
// Require polyfill
require('@babel/polyfill');

// Require class dependencies
const events = require('events');

/**
 * Create Eden Store class
 */
class EdenStore extends events {

  /**
   * Construct Eden Store class
   */
  constructor () {
    // Run super
    super(...arguments);

    // Set public variables
    this.bound = 'true';

    // Bind private variables
    this._hooks = {};

    // Bind public methods
    this.init  = this.init.bind(this);
    this.clear = this.clear.bind(this);

    // Check window and init
    if (typeof window !== 'undefined') {
      // Init frontend
      this.init(window.eden);
    }
  }

  /**
   * Init variables
   *
   * @param {object} variables
   */
  init (variables) {
    // Loop keys
    for (const key in variables) {
      // Set variable value
      this[key] = variables[key];
    }
  }

  /**
   * Clear store
   */
  clear () {
    // Set methods
    const methods = ['set', 'get', 'pre', 'post', 'hook', '_hooks', '__hook'];

    // Loop this
    for (const key in this) {
      // Check this has key
      if (this.hasOwnProperty(key)) {
        // Check if method
        if (methods.includes(key)) continue;

        // Remove
        delete this[key];
      }
    }

    // Check user
    if (this.user) this.user.clear();
  }

  /**
   * Sets key values
   *
   * @param  {string} key
   * @param  {*} val
   *
   * @return {EdenStore}
   */
  set (key, val) {
    // Set data
    const data = {
      'key' : key,
      'val' : val
    };

    // Run sey hook
    this.hook('set', data, () => {
      // Set value in this
      this[data.key] = data.val;

      // Emit value to key
      this.emit(data.key, data.val);
    });

    // Return this
    return this;
  }

  /**
   * Gets key values
   *
   * @param  {string} key
   *
   * @return {*}
   */
  get (key) {
    // Return from this
    return this[key];
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Hook Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Add pre-hook to act as pre
   *
   * @param {string}   hook
   * @param {function} fn
   */
  pre (hook, fn) {
    // Check hook
    this.__hook(hook);

    // Add to pre
    this._hooks[hook].pre.push(fn);
  }

  /**
   * Add post-hook to act as post
   *
   * @param {string}   hook
   * @param {function} fn
   */
  post (hook, fn) {
    // Check hook
    this.__hook(hook);

    // Add to post
    this._hooks[hook].post.push(fn);
  }


  /**
   * Adds kareem hook
   *
   * @param {string} hook
   * @param {array}  args
   */
  async hook (hook, ...args) {
    // Set fn
    let fn = false;

    // Get function
    if (args.length > 1 && args[args.length - 1] instanceof Function && typeof args[args.length - 1] === 'function' && args[args.length - 1].call) fn = args.splice(-1)[0];

    // Check hook
    this.__hook(hook);

    // Loop pre functions
    for (let a = 0; a < this._hooks[hook].pre.length; a++) {
      // Exec pre functions
      await this._hooks[hook].pre[a](...args);
    }

    // Exec actual function
    if (fn) await fn(...args);

    // Loop post functions
    for (let b = 0; b < this._hooks[hook].post.length; b++) {
      // Exec post function
      await this._hooks[hook].post[b](...args);
    }
  }

  /**
   * Checks hook
   *
   * @param {string} hook
   *
   * @private
   */
  __hook (hook) {
    // Ensure hook exists
    if (!this._hooks[hook]) this._hooks[hook] = {
      'pre'  : [],
      'post' : []
    };
  }

}

/**
 * Create new Eden Store instance
 *
 * @type {EdenStore}
 */
const built = new EdenStore();

/**
 * Export Eden Store instance
 *
 * @type {EdenStore}
 */
exports = module.exports = built;

/**
 * Export Eden Store instance to window
 *
 * @type {EdenStore}
 */
if (typeof window !== 'undefined') window.eden = built;
