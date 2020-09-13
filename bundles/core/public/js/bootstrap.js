
// Require class dependencies
const Events  = require('events');
const dotProp = require('dot-prop');

/**
 * Create Eden Store class
 */
class EdenStore extends Events {
  /**
   * Construct Eden Store class
   */
  constructor(...args) {
    // Run super
    super(...args);

    // Set public variables
    this.bound = 'true';

    // Bind private variables
    this._hooks = {};

    // Bind public methods
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);
    this.pre = this.pre.bind(this);
    this.post = this.post.bind(this);
    this.init = this.init.bind(this);
    this.hook = this.hook.bind(this);
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
  init(variables) {
    // Loop keys
    for (const key of Object.keys(variables)) {
      // Set variable value
      this[key] = variables[key];
    }

    // check environment
    if (this.get('config.environment') !== 'dev') return;

    // Dev hooks
    setTimeout(() => {
      // replace css
      this.socket.on('dev:scss', (scss) => {
        // replacing css
        console.log('[hot] replacing scss');

        // pre head
        if (!$('#eden-styles').length) {
          // append
          $('body').append('<style id="eden-styles" type="text/css"></style>');
        }
        $('#eden-prehead').attr('href', '');

        // replace with
        $('#eden-styles').html(`${scss}`);
      });
    }, 2000);
  }

  /**
   * Clear store
   */
  clear() {
    // Set methods
    const methods = ['set', 'get', 'pre', 'post', 'hook', '_hooks', '__hook'];

    // Loop this
    for (const key of Object.keys(this)) {
      // Check if method
      if (methods.includes(key)) continue;

      // Remove
      delete this[key];
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
  set(key, val) {
    // Set data
    const data = {
      key,
      val,
    };

    // Run sey hook
    this.hook('set', data, () => {
      // Set value in this
      if (data.key.includes('.')) {
        // set key/val
        dotProp.set(this, data.key, data.val);
      } else {
        // set key/val
        this[data.key] = data.val;
      }

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
  get(key) {
    // Return from this
    return dotProp.get(this, key);
  }


  // /////////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Hook Methods
  //
  // /////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Add pre-hook to act as pre
   *
   * @param {string}   hook
   * @param {function} fn
   */
  pre(hook, fn) {
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
  post(hook, fn) {
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
  async hook(hook, ...args) {
    // Set fn
    let fn = false;

    // Get function
    if (args.length > 1 && args[args.length - 1] instanceof Function && typeof args[args.length - 1] === 'function' && args[args.length - 1].call) {
      [fn] = args.splice(-1);
    }

    // Check hook
    this.__hook(hook);

    // Loop pre functions
    for (let a = 0; a < this._hooks[hook].pre.length; a += 1) {
      // Exec pre functions
      await this._hooks[hook].pre[a](...args);
    }

    // Exec actual function
    if (fn) await fn(...args);

    // Loop post functions
    for (let b = 0; b < this._hooks[hook].post.length; b += 1) {
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
  __hook(hook) {
    // Ensure hook exists
    if (!this._hooks[hook]) {
      this._hooks[hook] = {
        pre  : [],
        post : [],
      };
    }
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
module.exports = built;

/**
 * Export Eden Store instance to window
 *
 * @type {EdenStore}
 */
if (typeof window !== 'undefined') window.eden = built;
