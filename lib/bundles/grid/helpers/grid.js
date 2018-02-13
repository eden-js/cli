
// require dependencies
const helper = require ('helper');

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

    // bind methods
    this.data   = this.data.bind (this);
    this.rows   = this.rows.bind (this);
    this.page   = this.page.bind (this);
    this.post   = this.post.bind (this);
    this.sort   = this.sort.bind (this);
    this.model  = this.model.bind (this);
    this.route  = this.route.bind (this);
    this.filter = this.filter.bind (this);
    this.render = this.render.bind (this);

    // bind private methods
    this._bind = this._bind.bind (this);

    // set default options
    options = options || {};

    // bind variables
    this._way     = options.way     || false;
    this._rows    = options.rows    || 20;
    this._page    = options.page    || 1;
    this._sort    = options.sort    || false;
    this._model   = options.model   || false;
    this._where   = options.where   || this._model;
    this._route   = options.route   || '';
    this._filter  = options.filter  || {};
    this._filters = options.filters || {};
    this._columns = options.columns || {};

    // bind model
    this._bind ();
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

    // run model bind
    this._bind ();

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
   * returns filtered query
   *
   * @return {Promise}
   */
  async query () {
    // check filters
    for (var filter in this._filter) {
      // check filter exists
      if (!this._filters[filter]) {
        continue;
      }

      // check if filter has query
      if (this._filters[filter].query) {
        // run query
        await this._filters[filter].query (this._filter[filter]);
      } else {
        // run and
        this.where (filter, this._filter[filter]);
      }
    }

    // set sort
    if (this._sort && this._columns[this._sort] && this._columns[this._sort].sort && this._way !== false) {
      // check type
      if (typeof this._columns[this._sort].sort === 'function') {
        // set sort
        this._where = await this._columns[this._sort].sort (this._where, this._way);
      } else if (this._columns[this._sort].sort === true) {
        // set sort directly
        this._where = this._where.sort (this._sort, this._way);
      }
    }

    // return this
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
  async post (req, res) {
    // check rows
    if (req.body.rows) this._rows = parseInt (req.body.rows);
    // check page
    if (req.body.page) this._page = parseInt (req.body.page);
    // check order
    if (req.body.sort) this._sort = req.body.sort;
    // set way
    this._way = req.body.way;
    // check where
    if (req.body.filter) {
      // run loop
      for (var key in req.body.filter) {
        // check value
        if (!req.body.filter[key].length && !Object.keys (req.body.filter[key]).length) continue;

        // set filter
        this._filter[key] = req.body.filter[key];
      }
    }

    // return res
    let result = await this.render ();

    // send result
    res.json (result);
  }

  /**
   * exports columns
   *
   * @param  {Array}   rows
   * @param  {Boolean} exp
   *
   * @return {Promise}
   */
  data (rows, type) {
    // return map
    return Promise.all (rows.map (async (row) => {
      // set sanitised
      let sanitised = {};

      // loop columns
      await Promise.all (Object.keys (this._columns).map (async (column) => {
        // check if column export
        if (typeof this._columns[column].type !== 'undefined' && type !== this._columns[column].type) return;

        // load column
        let load = await row.get (column);

        // check format
        if (this._columns[column].format) load = await this._columns[column].format (load, row, type);

        // set to sanitised
        sanitised[column] = (load || '').toString ();
      }));

      // return sanitised
      return sanitised;
    }));
  }

  /**
   * runs post request
   *
   * @param  {Request}  req
   * @param  {String}   type
   */
  async export (req, type) {
    // check order
    if (req.body.sort) this._sort = req.body.sort;
    // set way
    this._way = req.body.way;
    // check where
    if (req.body.filter) {
      // run loop
      for (var key in req.body.filter) {
        this._filter[key] = req.body.filter[key];
      }
    }

    // run query
    await this.query ();

    // send result
    return await this.data (await this._where.find (), type);
  }

  /**
   * renders grid view
   *
   * @return {Promise}
   */
  async render (req) {
    // check rows
    if (req && req.query.rows) this._rows = parseInt (req.query.rows);
    // check page
    if (req && req.query.page) this._page = parseInt (req.query.page);
    // check order
    if (req && req.query.sort) this._sort = req.query.sort;
    // set way
    if (req && req.query.way) this._way = (req.query.way === 'false' ? false : parseInt (req.query.way));
    // check where
    if (req && req.query.filter) {
      // run loop
      for (var key in ((req || {}).query || {}).filter || {}) {
        // check value
        if (!req.query.filter[key].length || !Object.keys (req.query.filter[key]).length) continue;

        // set value
        this._filter[key] = req.query.filter[key];
      }
    }

    // get grid
    let response = {
      'data'    : [],
      'filter'  : this._filter,
      'filters' : [],
      'columns' : []
    };

    // set standard vars
    response.way   = this._way;
    response.page  = this._page;
    response.rows  = this._rows;
    response.sort  = this._sort;
    response.route = this._route;

    // do query
    await this.query ();

    // set total
    response.total = await this._where.count ();

    // complete query
    let rows = await this._where.skip (this._rows * (this._page - 1)).limit (this._rows).find ();

    // get data
    response.data = await this.data (rows, false);

    // setup columns
    for (let b in this._columns) {
      // check type
      if (this._columns[b].type) continue;

      // push into columns
      response.columns.push ({
        'id'    : b,
        'sort'  : this._columns[b].sort ? true : false,
        'width' : this._columns[b].width || false,
        'title' : this._columns[b].title
      });
    }

    // setup columns
    for (let c in this._filters) {
      // create the filters
      let filter = {
        'id'   : c,
        'type' : this._filters[c].type
      };

      // set extra fields
      if (this._filters[c].ajax) filter.ajax       = this._filters[c].ajax;
      if (this._filters[c].title) filter.title     = this._filters[c].title;
      if (this._filters[c].socket) filter.socket   = this._filters[c].socket;
      if (this._filters[c].options) filter.options = this._filters[c].options;

      // push into columns
      response.filters.push (filter);
    }

    // resolve
    return response;
  }

  /**
   * binds model
   */
  _bind () {
    // check model
    if (!this._model) return;

    // check where
    if (!this._where) this._where = this._model;

    // bind where or and methods
    ['where', 'match', 'ne', 'or', 'and'].forEach ((method) => {
      // create new function
      this[method] = (...args) => {
        // set where
        return this._where = this._where[method] (...args);
      };
    });
  }
}

/**
 * export grid helper class
 *
 * @type {grid}
 */
exports = module.exports = grid;
