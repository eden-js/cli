/* eslint-disable max-len */
/* eslint-disable consistent-return */
// Require class dependencies
import EdenModel from '@edenjs/model';

// Require local dependencies
import eden from 'eden';
import dotProp from 'dot-prop';

/**
 * Create Model class
 */
export default class Model extends EdenModel {
  /**
   * Construct Model class
   *
   * @param {object} data
   */
  constructor(...args) {
    // Run super
    super(...args);

    // Check data
    const data = args[0] || {};

    // Sind private variables
    this.__models = {};

    // Bind public variables
    this.eden = eden;
    this.unlock = () => {};
    this.logger = eden.logger;

    // Bind private methods
    this.__load = this.__load.bind(this);
    this.__sanitise = this.__sanitise.bind(this);

    // Bind methods
    this.save = this.save.bind(this);
    this.mutex = this.mutex.bind(this);
    this.remove = this.remove.bind(this);

    // Alias methods
    this.lock = this.mutex.bind(this);

    // Sloop data
    for (const key of Object.keys(data)) {
      // Set data
      this.set(key, data[key], true);
    }
  }

  /**
   * Saves model
   *
   * @param  {User} by
   * @param  {*}    args
   *
   * @return {Promise<EdenModel>}
   *
   * @async
   */
  async save(by, ...args) {
    // Set saved
    let saved = null;

    // Set updated
    this.set('updated_at', new Date());
    this.set('created_at', this.get('created_at') || new Date());

    // set updates
    const updates = this.__updates;

    // Await model update/create hook
    await eden.hook(`${this.constructor.name.toLowerCase()}.${this.__id ? 'update' : 'create'}`, this, { by, updates }, async () => {
      // Run parent save
      saved = await super.replace(...args);
    });

    // Emit model save to all threads
    eden.emit('model.save', {
      id      : this.__id,
      by      : by && by.get && by.get('_id') ? by.get('_id').toString() : null,
      model   : this.constructor.name.toLowerCase(),
      updates : Array.from(updates.values()),
    }, true);

    // Return saved model
    return saved;
  }

  /**
   * Removes model
   *
   * @param  {User} by
   * @param  {*}    args
   *
   * @return {Promise<EdenModel>}
   *
   * @async
   */
  async remove(by, ...args) {
    // Set removed
    let removed = null;

    // Await model remove hook
    await eden.hook(`${this.constructor.name.toLowerCase()}.remove`, this, { by, updates : new Set() }, async () => {
      // Run parent remove
      removed = await super.remove(...args);
    });

    // Emit model remove to all threads
    eden.emit('model.remove', {
      id    : this.__id,
      model : this.constructor.name.toLowerCase(),
    }, true);

    // Return removed
    return removed;
  }

  /**
   * Mutex cross thread
   *
   * @param  {number} ttl
   *
   * @return {Promise}
   *
   * @async
   */
  async mutex(ttl) {
    // Check id
    if (!this.get('_id')) return () => {};

    // Log locking to debug
    this.eden.logger.log('debug', `locking ${this.constructor.name.toLowerCase()} #${this.get('_id').toString()}`, {
      class : this.constructor.name.toLowerCase(),
    });

    // Create mutex
    const mutex = await eden.lock(`${this.constructor.name.toLowerCase()}.${this.get('_id').toString()}`, (ttl || 60 * 1000));

    // Refresh model after mutex
    await this.refresh();

    // Log locked to debug
    this.eden.logger.log('debug', `locked ${this.constructor.name.toLowerCase()} #${this.get('_id').toString()}`, {
      class : this.constructor.name.toLowerCase(),
    });

    // Set unlock
    this.unlock = () => {
      // Log unlocked to debug
      this.eden.logger.log('debug', `unlocked ${this.constructor.name.toLowerCase()} #${this.get('_id').toString()}`, {
        class : this.constructor.name.toLowerCase(),
      });

      // Release mutex
      mutex();
    };

    // Return unlock
    return this.unlock;
  }

  /**
   * Initialize model
   *
   * @async
   */
  static async initialize() {
    // Run static functions like creating indexes
  }

  /**
   * Loads model
   *
   * @param  {Object} obj
   *
   * @return {Promise}
   */
  static async load(obj) {
    // Check model and id
    if (!obj.model || !obj.id) return null;

    // Load field
    let found = model(obj.model);

    // Check model and id
    if (!found) return null;

    // Set found by id
    found = await found.findById(obj.id);

    // Return found
    return found;
  }

  /**
   * Unloads model
   *
   * @param  {*} model
   *
   * @return {Promise}
   */
  static unload(model) {
    // Return object
    return {
      id    : model.get('_id').toString(),
      model : model.constructor.name,
    };
  }

  /**
   * Run get middleware
   *
   * @return {*}
   */
  get(...args) {
    // Get data from super
    const data = super.get(...args);

    // Check data
    if (!data) return data;

    // Set has models
    let hasModels = false;

    // Check if has model and data is array
    if (Array.isArray(data)) {
      hasModels = !!data.find(sub => sub && typeof sub.id === 'string' && typeof sub.model === 'string');
    }

    // Check has models
    if (hasModels) {
      // Return Promise
      return new Promise(async (resolve) => {
        // Set values
        const values = [];

        // Loop data
        for (let i = 0; i < data.length; i += 1) {
          // Check data type
          if (data[i] && data[i].id && data[i].model) {
            // Set loaded value
            const value = await this.__load(data[i]);

            // Check value
            if (value) values.push(value);
          } else if (data[i]) {
            values.push(data[i]);
          }
        }

        // Resolve values
        resolve(values);
      });
    } if (typeof data.id === 'string' && typeof data.model === 'string') {
      // Return loaded data
      return this.__load(data);
    }

    // Return data
    return data;
  }

  /**
   * Run set middleware
   *
   * @param  {string}  key
   * @param  {*}       value
   * @param  {Boolean} preventSuper
   *
   * @return {*}
   */
  set(key, value, preventSuper) {
    // Check if value is array and map to sanitise or sanitise
    let sanitisedVal = null;

    if (Array.isArray(value)) {
      sanitisedVal = value.filter(field => field).map(field => this.__sanitise(field));
    } else {
      sanitisedVal = this.__sanitise(value);
    }

    // compare value
    if (JSON.stringify(sanitisedVal) === JSON.stringify(dotProp.get(this.__data, key))) return;

    // Return parent set
    return preventSuper ? dotProp.set(this.__data, key, sanitisedVal) : super.set(key, sanitisedVal);
  }

  /**
   * Tun set middleware
   *
   * @param  {string} key
   * @param  {*}      value
   *
   * @return {*}
   */
  push(key, value) {
    // Check if value is array and map to sanitise or sanitise
    let sanitisedVal = null;

    if (Array.isArray(value)) {
      sanitisedVal = value.filter(field => field).map(field => this.__sanitise(field));
    } else {
      sanitisedVal = this.__sanitise(value);
    }

    // Return next action
    return super.push(key, sanitisedVal);
  }

  /**
   * Returns this to JSON
   *
   * @return {Object}
   */
  toJSON() {
    // Return JSON model
    return {
      id    : this.get('_id') ? this.get('_id').toString() : null,
      model : this.constructor.name,
    };
  }

  /**
   * Loads field
   *
   * @param  {*} field
   *
   * @return {Promise}
   *
   * @async
   */
  async __load(field) {
    // Set found
    let found = false;

    // Check models
    if (!this.__models) this.__models = {};

    // Check field model type
    if (!this.__models[field.model]) this.__models[field.model] = {};

    // Check field model
    if (this.__models[field.model][field.id]) {
      // Set found
      found = this.__models[field.model][field.id];
    } else {
      // Load model
      found = model(field.model);

      // Set found by id
      found = await found.findById(field.id);

      // Set model found
      this.__models[field.model][field.id] = found;
    }

    // Return found
    return found;
  }

  /**
   * Sanitises field to object
   *
   * @param  {*} field
   *
   * @return {object|*}
   */
  __sanitise(field) {
    // Check field
    if (!(field instanceof EdenModel)) return field;

    // Check field has id
    if (!field.get('_id')) return false;

    // Check models
    if (!this.__models) this.__models = {};

    // Check field model type
    if (!this.__models[field.constructor.name.toLowerCase()]) {
      this.__models[field.constructor.name.toLowerCase()] = {};
    }

    // Set field model
    this.__models[field.constructor.name.toLowerCase()][field.get('_id').toString()] = field;

    // Return sanitised field
    return {
      id    : field.get('_id').toString(),
      model : field.constructor.name.toLowerCase(),
    };
  }

  /**
   * Sanitises object
   *
   * @param  {*}        value
   * @param  {string[]} keys
   *
   * @return {Promise<*>}
   *
   * @private
   *
   * @async
   */
  static async __sanitiseObject(value, ...keys) {
    // Check value type
    if (Array.isArray(value)) {
      // Return promise all sanitised
      return await Promise.all(await value.map(async (v) => {
        return await this.__sanitiseObject(v, ...keys);
      }));
    }

    if (value instanceof EdenModel || typeof value === 'object') {
      // Set is core
      const isCore = value instanceof EdenModel;

      // Check keys
      if (!keys || !keys.length) {
        if (isCore) {
          // Return value
          return value.sanitise ? await value.sanitise() : {};
        }

        // Return value
        return value;
      }

      // Set sanitised
      const sanitised = {};

      // Loop keys
      for (const key of keys) {
        // Check key type
        if (typeof key === 'string') {
          // Set sanitised value
          sanitised[key] = await this.__sanitiseObject(isCore ? await value.get(key) : value[key]);
        } else if (typeof key.field === 'string') {
          // Set sanitised field
          const sanitisedField = typeof key.sanitisedField === 'string' ? key.sanitisedField : key.field;

          // Check custom
          if (typeof key.custom === 'function') {
            // Set custom sanitised value
            sanitised[sanitisedField] = await key.custom(value);
          } else if (key.keys) {
            // Check if keys array
            if (!Array.isArray(key.keys)) {
              // Set keys array
              key.keys = [key.keys];
            }

            // Set sanitised value
            sanitised[sanitisedField] = await this.__sanitiseObject(isCore ? await value.get(key.field) : value[key.field], ...key.keys);
          } else if (typeof key.sanitise === 'function') {
            // Set sanitised value
            sanitised[sanitisedField] = await key.sanitise(isCore ? await value.get(key.field) : value[key.field]);
          } else {
            // Set sanitised value
            sanitised[sanitisedField] = await this.__sanitiseObject(isCore ? await value.get(key.field) : value[key.field]);
          }

          // Check default and sanitised value
          if (key.default && sanitised[sanitisedField] === undefined) {
            // Set default value
            sanitised[sanitisedField] = key.default;
          }
        }
      }

      // Return sanitised
      return sanitised;
    }

    // Return value
    return value;
  }

  /**
   * Sanitises model
   *
   * @param {string[]|object[]} keys
   *
   * @return {Promise<object>}
   *
   * @private
   *
   * @async
   */
  async __sanitiseModel(...keys) {
    // Set sanitised
    // eslint-disable-next-line no-underscore-dangle
    const sanitised = await this.constructor.__sanitiseObject(this, ...keys) || {};

    // Set to hook
    const toHook = {
      sanitised,
      args : [...keys],
    };

    // Update to hook
    toHook[this.constructor.name.toLowerCase()] = this;

    // Hook model sanitise
    await this.eden.hook(`${this.constructor.name.toLowerCase()}.sanitise`, toHook);

    // Return sanitised
    return sanitised;
  }
}