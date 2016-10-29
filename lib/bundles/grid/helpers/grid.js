/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
var helper = require ('helper');

/**
 * build datagrid helper class
 */
class grid extends helper {
    /**
     * construct datagrid helper
     */
    constructor (options) {
        // run super
        super ();

        // set default options
        options = options || {};

        // bind variables
        this._way     = options.way     || false;
        this._rows    = options.rows    || 20;
        this._page    = options.page    || 1;
        this._sort    = options.sort    || false;
        this._model   = options.model   || false;
        this._where   = options.where   || {};
        this._route   = options.route   || '';
        this._filter  = options.filter  || {};
        this._filters = options.filters || {};
        this._columns = options.columns || {};
    }

    /**
     * set rows
     *
     * @param  {*} model
     *
     * @return {grid}
     */
    rows (rows) {
        // set rows
        this._rows = rows;

        // allow chainable
        return this;
    }

    /**
     * set page
     *
     * @param  {*} page
     *
     * @return {grid}
     */
    page (page) {
        // set page
        this._page = page;

        // allow chainable
        return this;
    }

    /**
     * set sort
     *
     * @param  {String} sort
     * @param  {Integer} way
     *
     * @return {grid}
     */
    sort (sort, way) {
        // set sort
        this._way  = way;
        this._sort = sort;

        // allow chainable
        return this;
    }

    /**
     * set model
     *
     * @param  {*} model
     *
     * @return {grid}
     */
    model (model) {
        // set model
        this._model = model;

        // allow chainable
        return this;
    }

    /**
     * set route
     *
     * @param  {String} route
     */
    route (route) {
        // set route
        this._route = route;

        // allow chainable
        return this;
    }

    /**
     * set where
     *
     * @param  {*} where
     *
     * @return {grid}
     */
    where (where) {
        // set where
        this._where = where;

        // allow chainable
        return this;
    }

    /**
     * add filter
     *
     * @param  {String} key
     * @param  {*}      filter
     *
     * @return {grid}
     */
    filter (key, filter) {
        // set filter
        this._filters[key] = filter;

        // allow chainable
        return this;
    }

    /**
     * add column
     *
     * @param  {String} key
     * @param  {*}      column
     *
     * @return {grid}
     */
    column (key, column) {
        // set column
        this._columns[key] = column;

        // allow chainable
        return this;
    }

    /**
     * runs post request
     *
     * @param  {Request}  req
     * @param  {Response} res
     */
    post (req, res) {
        // check rows
        if (req.body.rows) this._rows = parseInt (req.body.rows);
        // check page
        if (req.body.page) this._page = parseInt (req.body.page);
        // check order
        if (req.body.sort) this._sort = req.body.sort;
        // check way
        if (req.body.way) this._way = req.body.way;
        // check where
        if (req.body.filter) {
            // run loop
            for (var key in req.body.filter) {
                if (req.body.filter[key].trim () !== '') {
                    this._filter[key] = req.body.filter[key];
                }
            }
        }

        // return res
        this.render ().then (result => {
            res.json (result);
        });
    }

    /**
     * renders grid view
     *
     * @return {Promise}
     */
    async render () {
        // set that
        var that = this;

        // get grid
        var response = {
            'data'    : [],
            'filters' : [],
            'columns' : []
        };

        // get current set
        var set = that._model.where (that.where);

        // set standard vars
        response.way   = that._way;
        response.page  = that._page;
        response.rows  = that._rows;
        response.sort  = that._sort;
        response.route = that._route;

        // set sort
        if (that._sort && that._columns[that._sort] && that._columns[that._sort].sort) {
            // check type
            if (typeof that._columns[that._sort].sort === 'function') {
                // set sort
                await that._sorts[that._sort] (set);
            } else if (that._columns[that._sort].sort === true) {
                // create sort object
                var sort = {};

                // set sort direction
                sort[that._sort] = that._way;

                // set sort directly
                set.sort (sort);
            } else {
                // set sort directly
                set.sort (that._sorts[that._sort]);
            }
        }

        // check filters
        for (var filter in that._filter) {
            // check filter exists
            if (!that._filters[filter]) {
                continue;
            }

            // check if filter has query
            if (that._filters[filter].query) {
                that._filters[filter].query (set, that._filter[filter]);
            } else {
                // setup where
                var where = {};

                // add to where
                where[filter] = that._filter[filter];

                // add to query
                set.where (where);
            }
        }

        // set total
        response.total = await set.count ();

        // complete query
        var rows = await set.limit (that._rows).skip (that._rows * (that._page - 1)).find ();

        // get columns
        for (var i = 0; i < rows.length; i++) {
            // create row
            var row = {};

            // loop columns
            for (var a in that._columns) {
                // get column
                var column = rows[i].get (a);

                // check for format
                if (that._columns[a].format) {
                    column = await that._columns[a].format (column, rows[i]);
                }

                // set column
                row[a] = column;
            }

            // push into data
            response.data.push (row);
        }

        // setup columns
        for (var b in that._columns) {
            // push into columns
            response.columns.push ({
                'id'    : b,
                'sort'  : that._columns[b].sort ? true : false,
                'title' : that._columns[b].title
            });
        }

        // setup columns
        for (var c in that._filters) {
            // push into columns
            response.filters.push ({
                'id'    : c,
                'type'  : that._filters[c].type,
                'title' : that._filters[c].title || false
            });
        }

        // resolve
        return response;
    }
}

/**
 * export grid helper class
 *
 * @type {grid}
 */
module.exports = grid;
