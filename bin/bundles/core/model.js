/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
var mongorito = require('mongorito');

/**
 * build model
 */
class model extends mongorito.Model {
    /**
     * construct model entity
     *
     * @param props
     */
    constructor(props) {
        // run super
        super(props);

        // bind model methods
        this._isModel   = this._isModel.bind(this);
        this._loadModel = this._loadModel.bind(this);

        // set model location
        this._modelLocation = module.parent.filename.replace(global.appRoot, '');
        this._loads         = {};

        // run attributes method
        this.getAttributes();

        // set attributes before save
        this.before ('save', 'setAttributes');
        this.after  ('save', 'getAttributes');


        console.log('working');
    }

    /**
     * gets models from attributes
     *
     * @param next
     */
    * getAttributes(next) {
        console.log('GET ATTRIBUTES');
        // loop attributes
        for (var key in this.attributes) {
            // set let attribute
            let attr = this.attributes[key];

            // check if is object
            if (attr === Object(attr) && attr.model) {
                // load model
                this.loadModel(key, attr);
            } else if (Array.isArray(attr)) {
                // loop object array
                for (var i = 0; i < attr.length; i++) {
                    // check if is object
                    if (attr[i] === Object(attr) && attr[i].model) {
                        this.loadModel(key + '.' + i, attr[i]);
                    }
                }
            }
        }

        // run next
        yield next;
    }

    /**
     * sets attributes
     *
     * @param next
     */
    * setAttributes(next) {
        // loop attributes
        for (var key in this.attributes) {
            // set let attribute
            let attr = this.attributes[key];

            // check if entity
            if (this.isModel(attr)) {
                // set array for save
                this.set(key, {
                    'id'    : attr.get('_id').toString(),
                    'model' : attr._modelLocation
                });
            } else if (Array.isArray(attr)) {
                // loop object array
                for (var i = 0; i < attr.length; i++) {
                    // check if is object
                    if (this.isModel(attr[i])) {
                        this.loadModel(key + '.' + i, attr[i]);
                    }
                }
            }
        }

        // run next
        yield next;
    }

    /**
     * check if model
     *
     * @param obj
     * @returns {boolean}
     * @private
     */
    isModel(obj) {
        // check if model
        if (obj === Object(obj) && obj._modelLocation) {
            return true;
        }
    }

    /**
     * loads model
     *
     * @param key
     * @param attr
     */
    * loadModel(key, attr) {
        // check model loaded
        if (!this._loads[attr.model]) {
            this._loads[attr.model] = require(global.appRoot + attr.model);
        }

        // load by id
        this.set(key, yield this._loads[attr.model].findById(attr.id));
    }
}

/**
 * export default model class
 *
 * @type {model}
 */
module.exports = model;