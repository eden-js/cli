/**
 * Created by Awesome on 2/6/2016.
 */

/**
 * build datagrid class
 */
class datagrid {
    /**
     * construct datagrid
     */
    constructor () {
        // bind datagrid methods
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
            icon             : 'icon fa',
            iconColumns      : 'fa-th-list',
            iconDown         : 'fa-sort-desc',
            iconRefresh      : 'fa-refresh',
            iconSearch       : 'fa-search',
            iconUp           : 'fa-sort-asc',
            pagination       : 'pagination pagination-sm',
            paginationButton : 'page-link'
        });

        // render grids
        jQuery ('body').on ('layout', function () {
            jQuery ('[data-grid]').each (function () {
                jQuery (this).bootgrid ({
                    'ajax' : true,
                    'url'  : jQuery (this).attr ('data-grid')
                });
            });
        });
    }
}

/**
 * export datagrid class
 *
 * @type {datagrid}
 */
module.exports = new datagrid ();
