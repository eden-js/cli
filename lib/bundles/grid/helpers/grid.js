/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// require dependencies
var co     = require ('co');
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
        this._rows    = options.rows    || 20;
        this._page    = options.page    || 1;
        this._model   = options.model   || false;
        this._where   = options.where   || {};
        this._order   = options.order   || false;
        this._route   = options.route   || '';
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
     * set order
     *
     * @param  {*} order
     *
     * @return {grid}
     */
    order (order) {
        // set order
        this._order = order;

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
        if (req.body.order) this._order = req.body.order;
        // check where
        if (req.body.filters) {
            // run loop
            for (var i = 0; i < req.body.filters.length; i++) {

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
    render () {
        // set that
        var that = this;

        // return promise
        return new Promise ((resolve, reject) => {
            // run coroutine
            co (function * () {
                // get grid
                var response = {
                    'data'    : [],
                    'columns' : []
                };

                // get current set
                var set = that._model.where (that.where);

                // get total
                response.page  = that._page;
                response.rows  = that._rows;
                response.route = that._route;
                response.total = yield set.count ();

                // check order
                if (that._order) set.order (that._order);

                // complete query
                var rows = yield set.limit (that._rows).skip (that._rows * (that._page - 1)).find ();

                // get columns
                for (var i = 0; i < rows.length; i++) {
                    // create row
                    var row = {};

                    // loop columns
                    for (var key in that._columns) {
                        // get column
                        var column = rows[i].get (key);

                        // check for format
                        if (that._columns[key].format) {
                            column = yield that._columns[key].format (column, rows[i]);
                        }

                        // set column
                        row[key] = column;
                    }

                    // push into data
                    response.data.push (row);
                }

                // setup columns
                for (var k in that._columns) {
                    // push into columns
                    response.columns.push ({
                        'id'    : k,
                        'title' : that._columns[k].title
                    });
                }

                // resolve
                resolve (response);
            });
        });
    }
}

/**
 * export grid helper class
 *
 * @type {grid}
 */
module.exports = grid;
