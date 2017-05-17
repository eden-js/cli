
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
  }

  /**
   * sanitises field to object
   *
   * @param  {Object} field
   *
   * @return {Object|*}
   */
  sanitise (field) {
    // check field
    if (!(field instanceof mongorito.Model)) return field;

    // save field if not saved
    if (!field.get ('_id')) return false;

    // return object
    return {
      'id'    : field.get ('_id').toString (),
      'model' : field.constructor.name
    };
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
    // hook create
    if (store.model) eden.hook (store.model.constructor.name + '.' + action.type.toLowerCase ().split ('/')[1], store.model);

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

    // return next action
    return next (action);
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
    if (!action.key) return next (action);

    // get field
    let field = dot.get (store.model.store.getState ().fields, action.key);

    // check field
    if (!field) return next (action);

    // set has m odel
    let hasModel = false;

    // check if has model and is array
    if (Array.isArray (field)) {
      // loop field
      for (let i = 0; i < field.length; i++) {
        // set has model
        if (field[i].id && field[i].model) hasModel = true;
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
          if (field[i].id && field[i].model) {
            // load model
            let built = model (field[i].model);

            // find
            built = await built.findById (field[i].id);

            // return find by id
            if (built) values.push (built);
          } else {
            // push field value
            if (field[i]) values.push (field[i]);
          }
        }

        // resolve
        resolve (values);
      });
    } else if (field.id && field.model) {
      // load model
      let built = model (field.model);

      // return find by id
      return built.findById (field.id);
    }

    // return next action
    return next (action);
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
    // loop fields
    for (var key in action.fields) {
      // check if array
      if (Array.isArray (action.fields[key])) {
        // loop
        for (let i = 0; i < action.fields[key].length; i++) {
          // set value
          action.fields[key][i] = this.sanitise (action.fields[key][i]);
        }
      } else {
        action.fields[key] = this.sanitise (action.fields[key]);
      }
    }

    // return next action
    return next (action);
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
        //  console.log (action.query[i][1]);
        }
      }
    }

    // return next action
    return next (action);
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
