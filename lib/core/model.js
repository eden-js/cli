
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
 * sanitise field
 *
 * @param  {*}  field
 */
const sanitise = (field) => {
  // check field
  if (!(field instanceof mongorito.Model)) return field;

  // save field if not saved
  if (!field.get ('_id')) return false;

  // return object
  return {
    'id'    : field.get ('_id').toString (),
    'model' : field.constructor.name
  };
};

/**
 * create middlware
 *
 * @return {Promise}
 */
const middleware = () => store => next => action => {
  // hook create
  if (store.model) eden.hook (store.model.constructor.name + '.' + action.type.toLowerCase ().split ('/')[1], store.model);

  // check set
  if (action.type === mongorito.ActionTypes.QUERY) {
    // loop for _id fix
    for (let i = 0; i < action.query.length; i++) {
      // check where
      if (action.query[i][0] === 'where') {
        // check id
        if (action.query[i][1][0] === '_id' && (typeof action.query[i][1][1] === 'string')) {
          action.query[i][1][0] = mongodb.ObjectID (action.query[i][1][1]);
        }
      }
    }
  }

  // check set
  if (action.type === mongorito.ActionTypes.SET) {
    // loop fields
    for (var key in action.fields) {
      // check if array
      if (Array.isArray (action.fields[key])) {
        // loop
        for (let i = 0; i < action.fields[key].length; i++) {
          // set value
          action.fields[key][i] = sanitise (action.fields[key][i]);
        }
      } else {
        action.fields[key] = sanitise (action.fields[key]);
      }
    }
  }

  // check get
  if (store.model && action.type === mongorito.ActionTypes.GET) {
    // check key
    if (!action.key) return next (action);

    // get field
    let field = dot.get (store.model.store.getState ().fields, action.key);

    // check field
    if (!field) return next (action);

    // check field type
    if (Array.isArray (field) && field[0].id && field[0].model) {
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

            // return find by id
            values.push (await built.findById (field[i].id));
          } else {
            // push field value
            values.push (field[i]);
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
  }

  // return next action
  return next (action);
};
// use middleware
Model.use (middleware);

/**
 * export default Model class
 *
 * @type {Model}
 */
exports = module.exports = Model;
