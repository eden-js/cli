<grid>
  <div class={ 'grid' : true, 'loading' : !this.loaded || this.loading }>
    <div class="row filters" if={ this.state.filters.length }>
      <div class="col-md-3 filter form-group" each={ f, i in this.state.filters }>
        <div data-is="grid-filter-{ f.type || 'text' }" filter={ f } values={ getState ().filter } on-filter={ onFilter } />
      </div>
    </div>
    <div if={ this.state.type !== 'columns' } class="data">
      <yield from="data" />
    </div>
    <table if={ this.state.type === 'columns' } class={ tableClass () }>
      <thead>
        <tr>
          <th each={ column, i in this.state.columns } data-column={ i } width={ column.width || false }>
            <a href="#!" if={ column.sort } class={ 'pull-right sort' : true, 'text-primary' : isSort (column), 'text-muted' : !isSort (column) } onclick={ onSort }>
              <i class={ 'fa mr-2' : true, 'fa-sort' : getState ().way === false || !isSort (column), 'fa-sort-up' : getState ().way === 1 && isSort (column), 'fa-sort-down' : getState ().way === -1 && isSort (column) } />
            </a>
            { this.t (column.title) }
          </th>
        </tr>
      </thead>
      <tbody>
        <tr each={ data, i in this.state.data }>
          <td each={ column, a in getState ().columns }>
            <raw data={ { 'html' : data[column.id] } } />
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row">
      <div class="col-sm-6">
        <small class="pagination-stats text-muted">
          { this.t ('Showing') } { (this.state.page - 1) * this.state.rows } - { (this.state.page * this.state.rows) > this.state.total ? this.state.total : (this.state.page * this.state.rows) } { this.t ('of') } { this.state.total }
        </small>
      </div>
      <div class="col-sm-6">
        <nav aria-label="Page navigation" class="float-sm-right">
          <ul class="pagination pagination-sm">
            <li class={ 'page-item' : true, 'disabled' : !hasPrev () }>
              <a class="page-link" href="#!" aria-label={ this.t ('First') } onclick={ onFirst }>
                { this.t ('First') }
              </a>
            </li>
            <li class={ 'page-item' : true, 'disabled' : !hasPrev () }>
              <a class="page-link" href="#!" aria-label={ this.t ('Previous') } onclick={ onPrev }>
                { this.t ('Previous') }
              </a>
            </li>
            <li each={ p, i in this.pages } class={ 'page-item' : true, 'active' : this.state.page === p }>
              <a class="page-link" href="#!" data-page={ p } onclick={ onPage }>{ p }</a>
            </li>
            <li class={ 'page-item' : true, 'disabled' : !hasNext () }>
              <a class="page-link" href="#!" aria-label={ this.t ('Next') } onclick={ onNext }>
                { this.t ('Next') }
              </a>
            </li>
            <li class={ 'page-item' : true, 'disabled' : !hasNext () }>
              <a class="page-link" href="#!" aria-label={ this.t ('Last') } onclick={ onLast }>
                { this.t ('Last') }
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin ('live');
    this.mixin ('i18n');

    // set variables
    this.state = {
      'way'     : opts.grid && opts.grid.way     ? opts.grid.way     : false,
      'rows'    : opts.grid && opts.grid.rows    ? opts.grid.rows    : 20,
      'live'    : opts.grid && opts.grid.live    ? opts.grid.live    : false,
      'type'    : opts.grid && opts.grid.type    ? opts.grid.type    : 'columns',
      'data'    : opts.grid && opts.grid.data    ? opts.grid.data    : [],
      'page'    : opts.grid && opts.grid.page    ? opts.grid.page    : 1,
      'sort'    : opts.grid && opts.grid.sort    ? opts.grid.sort    : false,
      'route'   : opts.grid && opts.grid.route   ? opts.grid.route   : '',
      'total'   : opts.grid && opts.grid.total   ? opts.grid.total   : 0,
      'filter'  : opts.grid && opts.grid.filter  ? opts.grid.filter  : {},
      'filters' : opts.grid && opts.grid.filters ? opts.grid.filters : [],
      'columns' : opts.grid && opts.grid.columns ? opts.grid.columns : []
    };

    // map data
    if (this.state.live) this.state.data = this.state.data.map ((line) => {
      // set data
      return this.live (this.state.type, line);
    });

    // set pages
    this.pages = [];

    // set loading
    this.loaded  = opts.grid || false;
    this.loading = false;


    /**
     * gets table class
     *
     * @return {String} class
     */
    tableClass () {
      // return string
      return opts.tableClass || 'table table-striped';
    }

    /**
     * return is column currently sorted
     *
     * @return {Boolean}
     */
    isSort (column) {
      // return boolean
      return this.state.sort === column.id;
    }

    /**
     * return has previous page
     *
     * @return {Boolean}
     */
    hasPrev () {
      return this.state.page > 1;
    }

    /**
     * return has next page
     *
     * @return {Boolean}
     */
    hasNext () {
      return this.state.page < Math.floor (this.state.total / this.state.rows) + 1;
    }

    /**
     * gets state
     *
     * @return {Object}
     */
    getState () {
      // return state
      return this.state;
    }

    /**
     * sets pages
     */
    setPages () {
      // reset pages
      this.pages = [];

      // set start
      let page  = (this.state.page - 5) < 1 ? 1 : (this.state.page - 5);
      let main  = page;
      let start = ((page - 1) * this.state.rows);

      // while start less than pages
      while (start < this.state.total) {
        // add to pages
        this.pages.push (page);

        // add to page
        page++;

        // set start value
        start = ((page - 1) * this.state.rows);

        // check if should stop
        if (main - page > 8 || this.pages.length > 9) {
          break;
        }
      }
    }

    /**
     * on filter function
     *
     * @param  {Event} e
     */
    onFilter (filter, value) {
      // set filter
      this.state.filter[filter.id] = value;

      // load view
      this.load ();

      // update view
      this.update ();
    }

    /**
     * on pagination click function
     *
     * @param  {Event} e
     */
    onPage (e) {
      // prevent scrolling to top
      e.preventDefault ();
      e.stopPropagation ();

      // get page
      this.state.page = e.target.dataset.page;

      // load view
      this.load ();

      // update view
      this.update ();
    }

    /**
     * on next click function
     */
    onLast (e) {
      // prevent scrolling to top
      e.preventDefault ();
      e.stopPropagation ();

      // get page
      this.state.page = Math.floor (this.state.total / this.state.rows) + 1;

      // load view
      this.load ();

      // update view
      this.update ();
    }

    /**
     * on previous click function
     */
    onFirst (e) {
      // prevent scrolling to top
      e.preventDefault ();
      e.stopPropagation ();

      // get page
      this.state.page = 1;

      // load view
      this.load ();

      // update view
      this.update ();
    }

    /**
     * on next click function
     */
    onNext (e) {
      // prevent scrolling to top
      e.preventDefault ();
      e.stopPropagation ();

      // get page
      this.state.page = this.hasNext () ? (this.state.page + 1) : this.page;

      // load view
      this.load ();

      // update view
      this.update ();
    }

    /**
     * on previous click function
     */
    onPrev (e) {
      // prevent scrolling to top
      e.preventDefault ();
      e.stopPropagation ();

      // get page
      this.state.page = this.hasPrev () ? (this.state.page - 1) : 1;

      // load view
      this.load ();

      // update view
      this.update ();
    }

    /**
     * on sort function
     *
     * @param {Event} e
     */
    onSort (e) {
      // prevent scrolling to top
      e.preventDefault ();
      e.stopPropagation ();

      // get link
      let th = jQuery (e.target).is ('th') ? jQuery (e.target) : jQuery (e.target).closest ('th');

      // get column
      let column = this.state.columns[th.attr ('data-column')];

      // check for id
      if (column.id === this.state.sort) {
        // set asc or desc
        if (this.state.way === false) {
          // set way
          this.state.way = -1;
        } else if (this.state.way === -1) {
          // set way
          this.state.way = 1;
        } else if (this.state.way === 1) {
          // reset sort
          this.state.way  = false;
          this.state.sort = false;
        }
      } else {
        // set sort
        this.state.way  = -1;
        this.state.sort = column.id;
      }

      // load view
      this.load ();

      // update view
      this.update ();
    }

    /**
     * loads datagrid by params
     */
    async load () {
      // set loading
      this.loading = true;

      // update view
      this.update ();

      // get state
      let state = jQuery.extend ({
        'prevent' : true
      }, eden.router.history.location.state);

      // set url
      window.eden.router.history.replace ({
        'pathname' : eden.router.history.location.pathname.split ('?')[0] + '?' + jQuery.param ({
          'way'    : this.state.way,
          'page'   : this.state.page,
          'rows'   : this.state.rows,
          'sort'   : this.state.sort,
          'filter' : this.state.filter
        }),
        'state' : state,
      })

      // log data
      let res = await fetch (this.state.route, {
        'body' : JSON.stringify ({
          'way'    : this.state.way,
          'page'   : this.state.page,
          'rows'   : this.state.rows,
          'sort'   : this.state.sort,
          'filter' : this.state.filter
        }),
        'method'  : 'post',
        'headers' : {
          'Content-Type': 'application/json'
        },
        'credentials' : 'same-origin'
      });

      // load json
      let data = await res.json ();

      // check if live
      if (this.state.live) this.emit ('deafen');

      // loop data
      for (var key in data) {
        this.state[key] = data[key];
      }

      // map data
      if (this.state.live) this.state.data = this.state.data.map ((line) => {
        // set data
        return this.live (this.state.type, line);
      });

      // set loading
      this.loading = false;

      // update view
      this.update ();
    }

    /**
     * on update function
     *
     * @param  {String} 'mount'
     */
    this.on ('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // set variables
      this.state = {
        'way'     : opts.grid && opts.grid.way     ? opts.grid.way     : false,
        'rows'    : opts.grid && opts.grid.rows    ? opts.grid.rows    : 20,
        'data'    : opts.grid && opts.grid.data    ? opts.grid.data    : [],
        'type'    : opts.grid && opts.grid.type    ? opts.grid.type    : 'columns',
        'page'    : opts.grid && opts.grid.page    ? opts.grid.page    : 1,
        'sort'    : opts.grid && opts.grid.sort    ? opts.grid.sort    : false,
        'live'    : opts.grid && opts.grid.live    ? opts.grid.live    : false,
        'route'   : opts.grid && opts.grid.route   ? opts.grid.route   : '',
        'total'   : opts.grid && opts.grid.total   ? opts.grid.total   : 0,
        'filter'  : opts.grid && opts.grid.filter  ? opts.grid.filter  : {},
        'filters' : opts.grid && opts.grid.filters ? opts.grid.filters : [],
        'columns' : opts.grid && opts.grid.columns ? opts.grid.columns : []
      };

      // map data
      if (this.state.live) this.state.data = this.state.data.map ((line) => {
        // set data
        return this.live (this.state.type, line);
      });

      // set pages
      this.pages = [];

      // set loading
      this.loaded  = opts.grid || false;
      this.loading = false;

      // update view
      this.update ();
    });

    /**
     * on update function
     *
     * @param  {String} 'update'
     */
    this.on ('update', () => {
      // set pages
      this.setPages ();
    });
  </script>
</grid>
