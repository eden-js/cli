
// require dependencies
const eden      = require ('eden');
const mongorito = require ('mongorito');

/**
 * build model
 */
class Model extends mongorito.Model {
  /**
   * construct model entity
   *
   * @param {*} attrs
   * @param {*} options
   */
  constructor (attrs, options) {
    // run super
    super (attrs, options);

    // bind methods
    this.model = this.model.bind (this);

    // bind private attributes
    this._save = this._save.bind (this);

    // bind super private methods
    this.__model      = this.__model.bind (this);
    this.__attributes = this.__attributes.bind (this);

    // set attributes before save
    this.before ('save',   '_save');
    this.before ('remove', '_remove');
  }

  /**
   * gets model
   *
   * @param key
   * @returns {Promise}
   */
  async model (key) {
    // set let attribute
    let attr  = this.attributes[key];
    let load  = false;
    let Model = false;

    // check if is object
    if (attr === Object (attr) && attr.model && attr.id) {
      // load model
      Model = model (attr.model);

      // await model
      load = await Model.findById (attr.id);

      // set model
      this.set (key, load);
    } else if (Array.isArray (attr)) {
      // set array variable
      let arr = [];

      // loop object array
      for (var i = 0; i < attr.length; i++) {
        // check if is object
        if (attr[i] === Object (attr[i]) && attr[i].model && attr[i].id) {
          // load model
          Model = model (attr[i].model);

          // await model
          load = await Model.findById (attr[i].id);

          // set model
          if (load) arr.push (load);
        } else {
          arr.push (attr[i]);
        }
      }

      // set array
      this.set (key, arr);
    }

    // return
    return this.get (key);
  }

  /**
   * before save function
   *
   * @param next
   *
   * @private
   */
  async _save (next) {
    // run attributes
    this.__attributes ();

    // check id
    if (!this.get ('_id')) {
      // hook create
      await eden.hook (this.constructor.name + '.create', this, async () => {
        // await next
        await next;
      });
    } else {
      // hook update
      await eden.hook (this.constructor.name + '.update', this, async () => {
        // await next
        await next;
      });
    }
  }

  /**
   * before remove function
   *
   * @param next
   *
   * @private
   */
  async _remove (next) {
    // hook create
    await eden.hook (this.constructor.name + '.remove', this, async () => {
      // await next
      await next;
    });
  }

  /**
   * check if model
   *
   * @param {*} check
   *
   * @returns {boolean}
   * @private
   */
  __model (check) {
    // check if model
    if (check && check.attributes && check.get) {
      return true;
    }
  }

  /**
   * sets attributes
   *
   * @private
   */
  __attributes () {
    // loop attributes
    for (var key in this.attributes) {
      // set let attribute
      let attr = this.attributes[key];

      // check if entity
      if (this.__model (attr)) {
        // set array for save
        this.attributes[key] = {
          'id'    : attr.get ('_id').toString (),
          'model' : attr.constructor.name
        };
      } else if (Array.isArray (attr)) {
        // set arr variable
        let arr = [];
        // loop object array
        for (var i = 0; i < attr.length; i++) {
          // check if is object
          if (this.__model (attr[i])) {
            // push to attributes array
            arr.push ({
              'id'    : attr[i].get ('_id').toString (),
              'model' : attr[i].constructor.name
            });
          } else {
            // push to attributes array
            arr.push (attr[i]);
          }
        }

        // set array
        this.attributes[key] = arr;
      }
    }
  }
}

/**
 * export default Model class
 *
 * @type {Model}
 */
exports = module.exports = Model;
