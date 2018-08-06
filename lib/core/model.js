// Require class dependencies
const DbModel = require('@eden-js/model').DbModel;

// Require local dependencies
const eden = require('eden');

/**
 * Create Model class
 */
class Model extends DbModel {

  /**
   * Construct Model class
   *
   * @param {object} data
   */
  constructor (data) {
    // Run super
    super(...arguments);

    // Check data
    if (!data) data = {};

    // Sind private variables
    this.__models = {};

    // Bind public variables
    this.eden   = eden;
    this.unlock = () => {};
    this.logger = eden.logger;

    // Bind private methods
    this.__load          = this.__load.bind(this);
    this.__sanitise      = this.__sanitise.bind(this);
    this.__sanitiseModel = this.__sanitiseModel.bind(this);

    // Bind methods
    this.save   = this.save.bind(this);
    this.mutex  = this.mutex.bind(this);
    this.remove = this.remove.bind(this);

    // Alias methods
    this.lock = this.mutex.bind(this);

    // Sloop data
    for (const key in data) {
      // Check has key
      if (data.hasOwnProperty(key)) {
        // Set data
        this.set(key, data[key]);
      }
    }
  }

  /**
   * Saves model
   *
   * @param  {*} args
   *
   * @return {Promise<DbModel>}
   *
   * @async
   */
  async save (...args) {
    // Set saved
    let saved = null;

    // Set updated
    this.set('updated_at', new Date());
    this.set('created_at', this.get('created_at') || new Date());

    // Await model update/create hook
    await eden.hook(this.constructor.name.toLowerCase() + '.' + (this.__id ? 'update' : 'create'), this, async () => {
      // Run parent save
      saved = await super.save(...args);
    });

    // Emit model save to all threads
    eden.emit('model.save', {
      'id'    : this.__id,
      'model' : this.constructor.name.toLowerCase()
    }, true);

    // Return saved model
    return saved;
  }

  /**
   * Removes model
   *
   * @param  {*} args
   *
   * @return {Promise<DbModel>}
   *
   * @async
   */
  async remove (...args) {
    // Set removed
    let removed = null;

    // Await model remove hook
    await eden.hook(this.constructor.name.toLowerCase() + '.remove', this, async () => {
      // Run parent remove
      removed = await super.remove(...args);
    });

    // Emit model remove to all threads
    eden.emit('model.remove', {
      'id'    : this.__id,
      'model' : this.constructor.name.toLowerCase()
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
  async mutex (ttl) {
    // Check id
    if (!this.get('_id')) return () => {};

    // Log locking to debug
    this.eden.logger.log('debug', 'locking ' + this.constructor.name.toLowerCase() + ' #' + this.get('_id').toString(), {
      'class' : this.constructor.name.toLowerCase()
    });

    // Create mutex
    const mutex = await eden.lock(this.constructor.name.toLowerCase() + '.' + this.get('_id').toString(), (ttl || 60 * 1000));

    // Refresh model after mutex
    await this.refresh();

    // Log locked to debug
    this.eden.logger.log('debug', 'locked ' + this.constructor.name.toLowerCase() + ' #' + this.get('_id').toString(), {
      'class' : this.constructor.name.toLowerCase()
    });

    // Set unlock
    this.unlock = () => {
      // Log unlocked to debug
      this.eden.logger.log('debug', 'unlocked ' + this.constructor.name.toLowerCase() + ' #' + this.get('_id').toString(), {
        'class' : this.constructor.name.toLowerCase()
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
  static async initialize () {
    // Run static functions like creating indexes
  }

  /**
   * Loads model
   *
   * @param  {Object} obj
   *
   * @return {Promise}
   */
  static async load (obj) {
    // Check model and id
    if (!obj.model || !obj.id) return;

    // Load field
    let found = model(obj.model);

    // Check model and id
    if (!found) return;

    // Set found by id
    found = await found.findById(obj.id);

    // Return found
    return found;
  }

  /**
   * Unloads model
   *
   * @param  {*} Model
   *
   * @return {Promise}
   */
  static unload (Model) {
    // Return object
    return {
      'id'    : Model.get('_id').toString(),
      'model' : Model.constructor.name
    };
  }

  /**
   * Run get middleware
   *
   * @return {*}
   */
  get () {
    // Get data from super
    const data = super.get(...arguments);

    // Check data
    if (!data) return data;

    // Set has models
    let hasModels = false;

    // Check if has model and data is array
    if (Array.isArray(data)) hasModels = !!data.find((sub) => {
      // Return sub
      return sub && sub.id && sub.model;
    });

    // Check has models
    if (hasModels) {
      // Return Promise
      return new Promise(async (resolve) => {
        // Set values
        const values = [];

        // Loop data
        for (let i = 0; i < data.length; i++) {
          // Check data type
          if (data[i] && data[i].id && data[i].model) {
            // Set loaded value
            const value = await this.__load(data[i]);

            // Check value
            if (value) values.push(value);
          } else {
            // Check data value
            if (data[i]) values.push(data[i]);
          }
        }

        // Resolve values
        resolve(values);
      });
    } else if (data.id && data.model) {
      // Return loaded data
      return this.__load(data);
    }

    // Return data
    return data;
  }

  /**
   * Run set middleware
   *
   * @param  {string} key
   * @param  {*}      value
   *
   * @return {*}
   */
  set (key, value) {
    // Check if value is array
    if (Array.isArray(value)) {
      // Filter and map value
      value = value.filter((field) => {
        // Return field exists
        return field;
      }).map((field) => {
        // Return sanitised field
        return this.__sanitise(field);
      });
    } else {
      // Set sanitised value
      value = this.__sanitise(value);
    }

    // Return parent set
    return super.set(key, value);
  }

  /**
   * Tun set middleware
   *
   * @param  {string} key
   * @param  {*}      value
   *
   * @return {*}
   */
  push (key, value) {
    // Check if array
    if (Array.isArray(value)) {
      // Map field
      value = value.filter((field) => {
        // Return field exists
        return field;
      }).map((field) => {
        // Sanitise field
        return this.__sanitise(field);
      });
    } else {
      // Set sanitised value
      value = this.__sanitise(value);
    }

    // Return next action
    return super.push(key, value);
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
  async __load (field) {
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
  __sanitise (field) {
    // Check field
    if (!(field instanceof DbModel)) return field;

    // Check field has id
    if (!field.get('_id')) return false;

    // Check models
    if (!this.__models) this.__models = {};

    // Check field model type
    if (!this.__models[field.constructor.name.toLowerCase()]) this.__models[field.constructor.name.toLowerCase()] = {};

    // Set field model
    this.__models[field.constructor.name.toLowerCase()][field.get('_id').toString()] = field;

    // Return sanitised field
    return {
      'id'    : field.get('_id').toString(),
      'model' : field.constructor.name.toLowerCase()
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
  static async __sanitiseObject (value, ...keys) {
    // Check value type
    if (Array.isArray(value)) {
      // Return promise all sanitised
      return await Promise.all(await value.map(async (Value) => {
        // Return sanitised value
        return await Model.__sanitiseObject(Value, ...keys);
      }));
    } else if (value instanceof DbModel || typeof value === 'object') {
      // Set is core
      const isCore = value instanceof DbModel;

      // Check keys
      if (!keys || !keys.length) {
        // Return value
        return isCore ? (value.sanitise ? await value.sanitise() : {}) : value;
      }

      // Set sanitised
      const sanitised = {};

      // Loop keys
      for (let index = 0; index < keys.length; index++) {
        // Set key
        const key = keys[index];

        // Check key type
        if (typeof key === 'string') {
          // Set sanitised value
          sanitised[key] = await Model.__sanitiseObject(isCore ? await value.get(key) : value[key]);
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
            sanitised[sanitisedField] = await Model.__sanitiseObject(isCore ? await value.get(key.field) : value[key.field], ...key.keys);
          } else if (typeof key.sanitise === 'function') {
            // Set sanitised value
            sanitised[sanitisedField] = await key.sanitise(isCore ? await value.get(key.field) : value[key.field]);
          } else {
            // Set sanitised value
            sanitised[sanitisedField] = await Model.__sanitiseObject(isCore ? await value.get(key.field) : value[key.field]);
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
  async __sanitiseModel (...keys) {
    // Set sanitised
    const sanitised = await Model.__sanitiseObject(this, ...keys) || {};

    // Set to hook
    const toHook = {
      'args'      : [...arguments],
      'sanitised' : sanitised
    };

    // Update to hook
    toHook[this.constructor.name.toLowerCase()] = this;

    // Hook model sanitise
    await this.eden.hook(`${this.constructor.name.toLowerCase()}.sanitise`, toHook);

    // Return sanitised
    return sanitised;
  }

}

/**
 * Export Model class
 *
 * @type {Model}
 */
exports = module.exports = Model;
