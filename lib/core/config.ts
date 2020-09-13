// Require dependencies
import yargs from 'yargs';
import dotProp from 'dot-prop';
import deepMerge from 'deepmerge';
import { EventEmitter } from 'events';

/**
 * create eden CLI
 */
class EdenConfig extends EventEmitter {
  /**
   * construct eden CLI
   */
  constructor(data = {}) {
    // run super
    super();

    // set data
    this.__data = data;

    // merge appconfig
    const argConfig = { ...(yargs.argv) };
    delete argConfig._;
    delete argConfig.$0;

    // set env
    argConfig.env = process.env;

    // loop env
    Object.keys(process.env).forEach((key) => {
      // check key
      if (['_'].includes(key)) return;

      // dotprop
      dotProp.set(argConfig, key.toLowerCase().split('_').join('.'), process.env[key]);
    });

    // arg config
    this.__data = deepMerge(this.__data, argConfig);

    // bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
  }

  /**
   * set key/value
   *
   * @param {*} key
   * @param {*} value
   */
  set(key, value) {
    // set value
    dotProp.set(this.__data, key, value);

    // got
    const got = this.get(key);

    // emit value
    this.emit(key.split('.')[0], got);

    // return get key
    return got;
  }

  /**
   * get value
   *
   * @param {*} key
   * @param {*} value
   */
  get(key, value) {
    // check value
    const actualValue = dotProp.get(this.__data, key);

    // check value
    if (typeof actualValue === 'undefined' && value) {
      // set
      this.set(key, value);

      // return get
      return this.get(key);
    }

    // return actual value
    return actualValue;
  }
}

// export default config
export default new EdenConfig(global.config);