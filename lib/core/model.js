/**
 * Created by Awesome on 1/30/2016.
 */

// require dependencies
const mongorito = require ('mongorito');

// require local dependencies
const models = require (global.appRoot + '/app/cache/models');

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

    // bind set/get methods
    this.getAttribute  = this.getAttribute.bind (this);
    this.setAttributes = this.setAttributes.bind (this);

    // bind model methods
    this.model   = this.model.bind (this);
    this.isModel = this.isModel.bind (this);

    // set attributes before save
    this.before ('save', 'setAttributes');
  }

  /**
   * gets model
   *
   * @param key
   * @returns {Promise}
   */
  model (key) {
    return this.getAttribute (key);
  }

  /**
   * gets attribute
   *
   * @param key
   * @returns {Promise}
   */
  async getAttribute (key) {
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
   * sets attributes
   *
   * @param next
   */
  async setAttributes (next) {
    // loop attributes
    for (var key in this.attributes) {
      // set let attribute
      let attr = this.attributes[key];

      // check if entity
      if (this.isModel (attr)) {
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
          if (this.isModel (attr[i])) {
            arr.push ({
              'id'    : attr[i].get ('_id').toString (),
              'model' : attr[i].constructor.name
            });
          } else {
            arr.push (attr[i]);
          }
        }

        // set array
        this.attributes[key] = arr;
      }
    }

    // run next
    await next;
  }

  /**
   * check if model
   *
   * @param obj
   * @returns {boolean}
   * @private
   */
  isModel (obj) {
    // check if model
    if (obj && obj.attributes && obj.get) {
      return true;
    }
  }
}

/**
 * export default Model class
 *
 * @type {Model}
 */
module.exports = Model;
