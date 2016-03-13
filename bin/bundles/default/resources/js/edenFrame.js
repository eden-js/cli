/**
 * Created by Awesome on 2/6/2016.
 */

// require dependencies
var riot = require ('riot');

// require tags from cache (do not use appRoot)
var tags = require ('../../../../../cache/tag/tags.min');

/**
 * build edenFrame class
 */
class edenFrame {
    /**
     * construct edenFrame
     */
    constructor () {
        // bind edenframe methods
        this._renderFrontendRenderer = this._renderFrontendRenderer.bind (this);

        // render frontend renderer
        this._renderFrontendRenderer ();
    }

    /**
     * renders frontend renderer
     *
     * @private
     */
    _renderFrontendRenderer () {
        riot.mount ('*');
    }
}

/**
 * export edenframe class
 *
 * @type {edenFrame}
 */
module.exports = new edenFrame ();