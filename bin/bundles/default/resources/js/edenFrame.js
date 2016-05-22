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
        this._renderGrids = this._renderGrids.bind (this);

        // render grids
        this._renderGrids ();
    }

    /**
     * renders grids
     *
     * @private
     */
    _renderGrids () {
        // set default settings
        jQuery.extend (jQuery.fn.bootgrid.Constructor.defaults.css, {
            icon        : 'icon fa',
            iconColumns : 'fa-th-list',
            iconDown    : 'fa-sort-desc',
            iconRefresh : 'fa-refresh',
            iconSearch  : 'fa-search',
            iconUp      : 'fa-sort-asc'
        });

        // render grids
        jQuery ('[data-grid]').each (function () {
            jQuery (this).bootgrid ({
                'ajax' : true,
                'url'  : jQuery (this).attr ('data-grid')
            });
        });
    }
}

/**
 * export edenframe class
 *
 * @type {edenFrame}
 */
module.exports = new edenFrame ();
