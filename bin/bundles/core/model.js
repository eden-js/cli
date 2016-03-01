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

        // bind set/get methods
        this.getAttributes = this.getAttributes.bind(this);
        this.setAttributes = this.setAttributes.bind(this);

        // bind model methods
        this.isModel   = this.isModel.bind(this);
        this.loadModel = this.loadModel.bind(this);

        // set model location
        this._modelLocation = module.parent.filename.replace(global.appRoot, '');
        this._loads         = {};

        // run attributes method
        this.getAttributes();

        // set attributes before save
        this.before ('save', 'setAttributes');
        this.after  ('save', 'getAttributes');
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
                this.set(key, this.loadModel(attr));
            } else if (Array.isArray(attr)) {
                // set array variable
                var arr = [];
                // loop object array
                for (var i = 0; i < attr.length; i++) {
                    // check if is object
                    if (attr[i] === Object(attr[i]) && attr[i].model) {
                        console.log(attr[i]);
                        arr.push(this.loadModel(attr[i]));
                    } else {
                        arr.push(attr[i]);
                    }
                }

                // set array
                this.set(key, arr);
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
                // set arr variable
                var arr = [];
                // loop object array
                for (var i = 0; i < attr.length; i++) {
                    // check if is object
                    if (this.isModel(attr[i])) {
                        arr.push({
                            'id'    : attr[i].get('_id').toString(),
                            'model' : attr[i]._modelLocation
                        });
                    } else {
                        arr.push(attr[i]);
                    }
                }

                // set array
                this.set(key, arr);
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
     * @param attr
     */
    * loadModel(attr) {
        // check model loaded
        if (!this._loads[attr.model]) {
            this._loads[attr.model] = require(global.appRoot + attr.model);
        }
        let load = yield this._loads[attr.model].findById(attr.id);
        console.log(this._loads(attr.model));
        console.log(load);

        // load by id
        return load;
    }
}

/**
 * export default model class
 *
 * @type {model}
 */
module.exports = model;