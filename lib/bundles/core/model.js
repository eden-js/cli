/**
 * Created by Awesome on 1/30/2016.
 */

    // use strict
'use strict';

// require dependencies
var co        = require ('co');
var mongorito = require ('mongorito');

// require local dependencies
var models = require (global.appRoot + '/app/cache/models');

/**
 * build model
 */
class model extends mongorito.Model {
    /**
     * construct model entity
     *
     * @param {*} a
     * @param {*} b
     */
    constructor (a, b) {
        // run super
        super (a, b);

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
    getAttribute (key) {
        // set variables
        var that = this;
        // return promise
        return new Promise ((resolve, reject) => {
            // run coroutine
            co (function * () {
                // set let attribute
                let attr  = that.attributes[key];
                var load  = false;
                var Model = false;

                // check if is object
                if (attr === Object (attr) && attr.model && attr.id) {
                    // load model
                    Model = yield that._require (attr.model);

                    // yield model
                    load = yield Model.findById (attr.id);

                    // set model
                    that.set (key, load);
                } else if (Array.isArray (attr)) {
                    // set array variable
                    var arr = [];
                    // loop object array
                    for (var i = 0; i < attr.length; i++) {
                        // check if is object
                        if (attr[i] === Object (attr[i]) && attr[i].model && attr[i].id) {
                            // load model
                            Model = yield that._require (attr[i].model);

                            // yield model
                            load = yield Model.findById (attr[i].id);

                            // set model
                            arr.push (load);
                        } else {
                            arr.push (attr[i]);
                        }
                    }

                    // set array
                    that.set (key, arr);
                }

                // return
                resolve (that.get (key));
            });
        });
    }

    /**
     * sets attributes
     *
     * @param next
     */
    setAttributes (next) {
        // run that
        var that = this;

        // run coroutine
        co (function * () {
            // loop attributes
            for (var key in that.attributes) {
                // set let attribute
                let attr = that.attributes[key];

                // check if entity
                if (that.isModel (attr)) {
                    // set array for save
                    that.attributes[key] = {
                        'id'    : attr.get ('_id').toString (),
                        'model' : attr.constructor.name
                    };
                } else if (Array.isArray (attr)) {
                    // set arr variable
                    var arr = [];
                    // loop object array
                    for (var i = 0; i < attr.length; i++) {
                        // check if is object
                        if (that.isModel (attr[i])) {
                            arr.push ({
                                'id'    : attr[i].get ('_id').toString (),
                                'model' : attr[i].constructor.name
                            });
                        } else {
                            arr.push (attr[i]);
                        }
                    }

                    // set array
                    that.attributes[key] = arr;
                }
            }

            // run next
            yield next;
        });
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
        if (obj.attributes) {
            return true;
        }
    }

    /**
     * require model file
     *
     * @param  {String} Model
     *
     * @return {*}
     */
    _require (Model) {
        // check model name
        Model = Model.split ('/')[Model.split ('/').length - 1].split ('.')[0].toLowerCase ();

        // return promise
        return new Promise ((resolve, reject) => {
            // check if model exists
            if (!models[Model]) {
                return reject ('the model ' + Model + ' does not exist');
            }

            // return required model
            try {
                // load model class
                var loaded = require (global.appRoot + models[Model]);

                // resolve model
                resolve (loaded);
            } catch (e) {
                reject (e);
            }
        });
    }
}

/**
 * export default model class
 *
 * @type {model}
 */
module.exports = model;
