
// require dependencies
const core = require ('edenjs-model').DbModel;
const eden = require ('eden');

/**
 * build model
 */
class edenModel extends core {

  /**
   * construct model entity
   *
   * @param {*} data
   */
  constructor (data) {
    // run super
    super (...arguments);

    // check data
    if (!data) data = {};

    // bind private variables
    this.__models = {};

    // bind public variables
    this.eden   = eden;
    this.logger = eden.logger;

    // bind private methods
    this.__load     = this.__load.bind (this);
    this.__sanitise = this.__sanitise.bind (this);

    // bind methods
    this.save   = this.save.bind (this);
    this.mutex  = this.mutex.bind (this);
    this.remove = this.remove.bind (this);

    // alias methods
    this.lock = this.mutex.bind (this);

    // set data
    for (let key in data) {
      // set
      this.set (key, data[key]);
    }
  }

  /**
   * saves model
   *
   * @param  {*}  args
   *
   * @return {Promise}
   */
  async save (...args) {
    // set returned
    let returned = null;

    // set updated
    this.set ('updated_at', new Date ());
    this.set ('created_at', this.get ('created_at') || new Date ());

    // await hook
    await eden.hook (this.constructor.name + '.' + (this.__id ? 'update' : 'create'), this, async () => {
      // run parent save
      returned = await super.save (...args);
    });

    // return this
    return returned;
  }

  /**
   * saves model
   *
   * @param  {*}  args
   *
   * @return {Promise}
   */
  async remove (...args) {
    // set returned
    let returned = null;

    // await hook
    await eden.hook (this.constructor.name + '.remove', this, async () => {
      // run parent save
      returned = await super.remove (...args);
    });

    // return this
    return returned;
  }

  /**
   * mutex cross thread
   *
   * @param  {Boolean}  all
   *
   * @return {Promise}
   */
  async mutex () {
    // lock in eden
    if (!this.get ('_id')) return () => {};

    // return mutex
    let mutex = await eden.lock (this.constructor.name + '.' + this.get ('_id').toString (), true);

    // refresh model after mutex
    await this.refresh ();

    // return mutex
    return mutex;
  }

  /**
   * initialize model
   */
  static async initialize () {
    // run static functions like create index
  }

  /**
   * run get middleware
   *
   * @return {*}
   */
  get () {
    // get from super
    let field = super.get (...arguments);

    // check field
    if (!field) return field;

    // set has m odel
    let hasModels = false;

    // check if has model and is array
    if (Array.isArray (field)) hasModels = !!field.find ((sub) => {
      // return sub
      return sub && sub.id && sub.model;
    });

    // check field type
    if (hasModels) {
      // return Promise
      return new Promise (async (resolve) => {
        // set values
        let values = [];

        // loop field
        for (let i = 0; i < field.length; i++) {
          // check field type
          if (field[i] && field[i].id && field[i].model) {
            // return promise
            let value = await this.__load (field[i]);

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
      return this.__load (field);
    }

    // return next action
    return field;
  }

  /**
   * run set middleware
   *
   * @param  {String} key
   * @param  {*}      value
   *
   * @return {*}
   */
  set (key, value) {
    // check if array
    if (Array.isArray (value)) {
      // map field
      value = value.filter ((field) => {
        // return field exists
        return field;
      }).map ((field) => {
        // sanitise field
        return this.__sanitise (field);
      });
    } else {
      // set sanitised value
      value = this.__sanitise (value);
    }

    // return next action
    return super.set (key, value);
  }

  /**
   * loads field
   *
   * @param  {*}  field
   *
   * @return {Promise}
   */
  async __load (field) {
    // let found
    let found = false;

    // check model
    if (!this.__models) this.__models = {};
    if (!this.__models[field.model]) this.__models[field.model] = {};

    // check model
    if (this.__models[field.model][field.id]) {
      // resolve field
      found = this.__models[field.model][field.id];
    } else {
      // load model
      found = model (field.model);

      // return find by id
      found = await found.findById (field.id);

      // set found
      this.__models[field.model][field.id] = found;
    }

    // resolve
    return found;
  }

  /**
   * sanitises field to object
   *
   * @param  {Object} field
   *
   * @return {Object|*}
   */
  __sanitise (field) {
    // check field
    if (!(field instanceof core)) return field;

    // save field if not saved
    if (!field.get ('_id')) return false;

    // set field value
    if (!this.__models) this.__models = {};
    if (!this.__models[field.constructor.name]) this.__models[field.constructor.name] = {};

    // set value
    this.__models[field.constructor.name][field.get ('_id').toString ()] = field;

    // return object
    return {
      'id'    : field.get ('_id').toString (),
      'model' : field.constructor.name
    };
  }
}

/**
 * export default Model class
 *
 * @type {Model}
 */
exports = module.exports = edenModel;
