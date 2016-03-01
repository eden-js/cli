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
    constructor(props) {
        super(props);

        console.log(module.parent);
    }
    /**
     * check attributes
     *
     * @private
     */
    _checkAttributes() {
        for (var key in this.attributes) {
            var attr = this.attributes[key];
            if (attr === Object(attr)) {
                if (attr.entity) {
                    //this.attributes[key] = require(global.appRoot + attr.entity).findById(attr.id);
                }
            }
        }
    }
}

/**
 * export default model class
 *
 * @type {model}
 */
module.exports = model;