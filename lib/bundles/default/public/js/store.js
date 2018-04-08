
// require dependencies
const events = require ('events');

/**
 * create eden store
 */
class edenStore extends events {

  /**
   * construct riot store
   */
  constructor () {
    // set observable
    super (...arguments);

    this.bound = 'true';

    // bind private variables
    this._hooks = {};

    // bind methods
    this.init  = this.init.bind (this);
    this.clear = this.clear.bind (this);

    // check window
    if (typeof window !== 'undefined') this.init (window.eden);
  }

  /**
   * init variables
   *
   * @param  {Object} variables
   */
  init (variables) {
    // loop keys
    for (var key in variables) {
      // set value
      this[key] = variables[key];
    }
  }

  /**
   * clear store
   */
  clear () {
    // set methods
    let methods = ['set', 'get', 'pre', 'post', 'hook', '_hooks', '__hook'];

    // loop this
    for (let key in this) {
      // check if method
      if (methods.includes (key)) continue;

      // remove
      delete this[key];
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
  async set (key, val) {
    // create changable object
    let data = {
      'key' : key,
      'val' : val
    };

    // await hook
    this.hook ('set', data, () => {
      // set to this
      this[data.key] = data.val;

      // emit to this
      this.emit (data.key, data.val);
    });

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


  //////////////////////////////////////////////////////////////////////////////
  //
  //  Hook Methods
  //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * add post hook to act as pre
   *
   * @param {String} hook
   * @param {Function} fn
   */
  pre (hook, fn) {
    // check hook
    this.__hook (hook);

    // add to post
    this._hooks[hook].pre.push (fn);
  }

  /**
   * add post hook to act as pre
   *
   * @param {String} hook
   * @param {Function} fn
   */
  post (hook, fn) {
    // check hook
    this.__hook (hook);

    // add to post
    this._hooks[hook].post.push (fn);
  }


  /**
   * adds kareem hook
   *
   * @param {String} hook
   */
  async hook (hook, ...args) {
    // set fn
    let fn = false;

    // get function
    if (args.length > 1 && args[args.length - 1] instanceof Function && typeof args[args.length - 1] === 'function' && args[args.length - 1].call) fn = args.splice (-1)[0];

    // check hook
    this.__hook (hook);

    // exec pres
    for (var a = 0; a < this._hooks[hook].pre.length; a++) {
      // exec pre
      await this._hooks[hook].pre[a] (...args);
    }

    // exec actual function
    if (fn) await fn (...args);

    // exec post
    for (var b = 0; b < this._hooks[hook].post.length; b++) {
      // exec pre
      await this._hooks[hook].post[b] (...args);
    }
  }

  /**
   * checks hook
   *
   * @param {String} hook
   *
   * @private
   */
  __hook (hook) {
    // check hook exists
    if (!this._hooks[hook]) this._hooks[hook] = {
      'pre'  : [],
      'post' : []
    };
  }
}

/**
 * build riot store
 *
 * @type {edenStore}
 */
const built = new edenStore ();

/**
 * export built riot store
 *
 * @type {riotStore}
 */
exports = module.exports = built;

/**
 * export built to window
 *
 * @type {riotStore}
 */
if (typeof window !== 'undefined') window.eden = built;
