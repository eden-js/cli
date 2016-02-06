/**
 * Created by Awesome on 2/6/2016.
 */

var riot = require('riot');
var tags = require('../../../../../cache/tag/tags.min');

/**
 * edenFrame class
 */
class edenFrame {
    /**
     * construct edenFrame
     */
    constructor() {
        // bind edenframe methods
        this._renderFrontendRenderer = this._renderFrontendRenderer.bind(this);

        // render frontend renderer
        this._renderFrontendRenderer();
    }

    /**
     * renders frontend renderer
     * @private
     */
    _renderFrontendRenderer() {
        riot.mount('*');
    }
}

/**
 * export edenframe
 * @type {edenFrame}
 */
module.exports = new edenFrame();