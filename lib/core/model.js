
// require dependencies
const dot       = require ('dot-prop');
const eden      = require ('eden');
const mongodb   = require ('mongodb');
const mongorito = require ('mongorito');

/**
 * build model
 */
class Model extends mongorito.Model {
  /**
   * construct model entity
   */
  constructor () {
    // run super
    super (...arguments);

    // bind methods
    this.model = this.model.bind (this);

    // set models
    this.models = {};
  }

  /**
   * gets model
   *
   * @param key
   * @returns {Promise}
   */
  async model (key) {
    // return get
    return this.get (key);
  }
}

/**
 * build middleware class
 *
 * @type {[type]}
 */
class middleware {
  /**
   * construct model middleware
   */
  constructor () {
    // use middleware
    Model.use (() => store => next => action => {
      // run middleware
      return this.middleware (store, next, action);
    });

    // bind methods
    this.middleware = this.middleware.bind (this);

    // bind super private methods
    this.__get      = this.__get.bind (this);
    this.__set      = this.__set.bind (this);
    this.__load     = this.__load.bind (this);
    this.__query    = this.__query.bind (this);
    this.__sanitise = this.__sanitise.bind (this);
  }

  /**
   * middleware Function
   *
   * @param  {*}        store
   * @param  {Function} next
   * @param  {Object}   action
   *
   * @return {Promise}
   */
  middleware (store, next, action) {
    // check set
    if (action.type === mongorito.ActionTypes.QUERY) {
      // run query
      return this.__query (store, next, action);
    }

    // check set
    if (action.type === mongorito.ActionTypes.SET) {
      // run set
      return this.__set (store, next, action);
    }

    // check get
    if (store.model && action.type === mongorito.ActionTypes.GET) {
      // run get
      return this.__get (store, next, action);
    }

    // check action
    if (!store.model || [mongorito.ActionTypes.REMOVE, mongorito.ActionTypes.CREATE, mongorito.ActionTypes.UPDATE].indexOf (action.type) === -1) return next (action);

    // hook create
    return new Promise ((resolve) => {
      // run hook
      eden.hook (store.model.constructor.name + '.' + action.type.toLowerCase ().split ('/')[1], store.model, async () => {
        // reset fields
        if (action.fields) action.fields = store.model.store.getState ().fields;

        // resolve next action
        return resolve (await next (action));
      });
    });
  }

  /**
   * run get middleware
   *
   * @param  {Store}    store
   * @param  {Function} next
   * @param  {Object}   action
   *
   * @return {*}
   */
  __get (store, next, action) {
    // check key
    if (!action.key) return store.model.store.getState ().fields || {};

    // get field
    let field = dot.get (store.model.store.getState ().fields || {}, action.key);

    // check field
    if (!field) return field;

    // set has m odel
    let hasModel = false;

    // check if has model and is array
    if (Array.isArray (field)) {
      // loop field
      for (let i = 0; i < field.length; i++) {
        // set has model
        if (field[i] && field[i].id && field[i].model) hasModel = true;
      }
    }

    // check field type
    if (hasModel) {
      // return Promise
      return new Promise (async (resolve) => {
        // set values
        let values = [];

        // loop field
        for (let i = 0; i < field.length; i++) {
          // check field type
          if (field[i] && field[i].id && field[i].model) {
            // return promise
            let value = await this.__load (store.model, field[i]);

            // return find by id
            if (value) values.push (value);
          } else {
            // push field value
            if (field[i]) values.push (field[i]);
          }
        }

        // resolve
        resolve (values);
      });
    } else if (field.id && field.model) {
      // return promise
      return this.__load (store.model, field);
    }

    // return next action
    return field;
  }

  /**
   * run set middleware
   *
   * @param  {Store}    store
   * @param  {Function} next
   * @param  {Object}   action
   *
   * @return {*}
   */
  __set (store, next, action) {
    // load state
    let fields = store.model.store.getState ().fields;

    // loop fields
    for (var key in action.fields) {
      // check if array
      if (Array.isArray (action.fields[key])) {
        // map field
        action.fields[key] = action.fields[key].map (field => {
          // return sanitised field
          return this.__sanitise (store.model, field);
        });
      } else {
        action.fields[key] = this.__sanitise (store.model, action.fields[key]);
      }

      // set fields
      fields[key] = action.fields[key];
    }

    // return next action
    return action.fields;
  }

  /**
   * loads field
   *
   * @param  {*}  field
   *
   * @return {Promise}
   */
  async __load (mod, field) {
    // let found
    let found = false;

    // check model
    if (!mod.models) mod.models = {};
    if (!mod.models[field.model]) mod.models[field.model] = {};

    // check model
    if (mod.models[field.model][field.id]) {
      // resolve field
      found = mod.models[field.model][field.id];
    } else if (field.id.toString ().length === 24) {
      // load model
      found = model (field.model);

      // return find by id
      found = await found.findById (field.id);

      // set found
      mod.models[field.model][field.id] = found;
    }

    // resolve
    return found;
  }

  /**
   * run query middleware
   *
   * @param  {Store}    store
   * @param  {Function} next
   * @param  {Object}   action
   *
   * @return {*}
   */
  __query (store, next, action) {
    // loop for _id fix
    for (let i = 0; i < action.query.length; i++) {
      // check where
      if (action.query[i][0] === 'where') {
        // check id
        if (action.query[i][1][0] === '_id' && (typeof action.query[i][1][1] === 'string')) {
          action.query[i][1][0] = mongodb.ObjectID (action.query[i][1][1]);
        }
        if (typeof action.query[i][1] === 'object') {
          // console.log (action.query[i][1]);
        }
      }
    }

    // return next action
    return next (action);
  }

  /**
   * sanitises field to object
   *
   * @param  {*}      mod
   * @param  {Object} field
   *
   * @return {Object|*}
   */
  __sanitise (mod, field) {
    // check field
    if (!(field instanceof mongorito.Model)) return field;

    // save field if not saved
    if (!field.get ('_id')) return false;

    // set field value
    if (!mod.models) mod.models = {};
    if (!mod.models[field.constructor.name]) mod.models[field.constructor.name] = {};

    // set value
    mod.models[field.constructor.name][field.get ('_id').toString ()] = field;

    // return object
    return {
      'id'    : field.get ('_id').toString (),
      'model' : field.constructor.name
    };
  }
}

// build middleware
new middleware ();

/**
 * export default Model class
 *
 * @type {Model}
 */
exports = module.exports = Model;
