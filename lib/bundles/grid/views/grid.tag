<grid>
  <div class={ 'grid' : true, 'loading' : !this.loaded || this.loading }>
    <div class="row filters" if={ opts.grid.filters.length }>
      <div class="col-md-3 filter form-group" each={ f, i in opts.grid.filters }>
        <div data-is="grid-filter-{ f.type || 'text' }" filter={ f } values={ grid ().filter } onfilter={ onFilter } />
      </div>
    </div>
    <table class={ tableClass () }>
      <thead>
        <tr>
          <th each={ column, i in opts.grid.columns } data-column={ i } width={ column.width || false }>
            <a href="#!" if={ column.sort } class={ 'pull-right sort' : true, 'text-muted' : !isSort (column) } onclick={ onSort }>
              <i class={ 'fa' : true, 'fa-sort' : grid ().way === false || !isSort (column), 'fa-sort-asc' : grid ().way === 1 && isSort (column), 'fa-sort-desc' : grid ().way === -1 && isSort (column) } />
            </a>
            { column.title }
          </th>
        </tr>
      </thead>
      <tbody>
        <tr each={ data, i in opts.grid.data }>
          <td each={ column, a in grid ().columns }>
            <raw html={ data[column.id] } />
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row">
      <div class="col-sm-6">
        <small class="pagination-stats text-muted">
          Showing { (opts.grid.page - 1) * opts.grid.rows } - { (opts.grid.page * opts.grid.rows) > opts.grid.total ? opts.grid.total : (opts.grid.page * opts.grid.rows) } of { opts.grid.total }
        </small>
      </div>
      <div class="col-sm-6">
        <nav aria-label="Page navigation" class="float-sm-right">
          <ul class="pagination pagination-sm">
            <li class={ 'page-item' : true, 'disabled' : !hasPrev () }>
              <a class="page-link" href="#!" aria-label="Previous" onclick={ onPrev }>
                Previous
              </a>
            </li>
            <li each={ p, i in this.pages } class={ 'page-item' : true, 'active' : grid ().page === p }>
              <a class="page-link" href="#!" data-page={ p } onclick={ onPage }>{ p }</a>
            </li>
            <li class={ 'page-item' : true, 'disabled' : !hasNext () }>
              <a class="page-link" href="#!" aria-label="Next" onclick={ onNext }>
                Next
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>

  <script>
    // set variables
    opts.grid = opts.grid || {
      'way'     : false,
      'rows'    : 20,
      'data'    : [],
      'page'    : 1,
      'sort'    : false,
      'route'   : '',
      'total'   : 0,
      'filter'  : {},
      'filters' : [],
      'columns' : []
    };

    // set pages
    opts.pages = [];

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
      return opts.table || 'table table-striped';
    }

    /**
     * return is column currently sorted
     *
     * @return {Boolean}
     */
    isSort (column) {
      // return boolean
      return opts.grid.sort === column.id;
    }

    /**
     * return has previous page
     *
     * @return {Boolean}
     */
    hasPrev () {
      return opts.grid.page > 1;
    }

    /**
     * return has next page
     *
     * @return {Boolean}
     */
    hasNext () {
      return opts.grid.page < Math.floor (opts.grid.total / opts.grid.rows) + 1;
    }

    /**
     * sets pages
     */
    setPages () {
      // reset pages
      this.pages = [];

      // set start
      let page  = (opts.grid.page - 5) < 1 ? 1 : (opts.grid.page - 5);
      let main  = page;
      let start = ((page - 1) * opts.grid.rows);

      // while start less than pages
      while (start < opts.grid.total) {
        // add to pages
        this.pages.push (page);

        // add to page
        page++;

        // set start value
        start = ((page - 1) * opts.grid.rows);

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
      opts.grid.filter[filter.id] = value;

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
      // get page
      opts.grid.page = e.target.dataset.page;

      // load view
      this.load ();

      // update view
      this.update ();
    }

    /**
     * on next click function
     */
    onNext () {
      // get page
      opts.grid.page = this.hasNext () ? (opts.grid.page + 1) : opts.grid.page;

      // load view
      this.load ();

      // update view
      this.update ();
    }

    /**
     * on previous click function
     */
    onPrev () {
      // get page
      opts.grid.page = this.hasPrev () ? (opts.grid.page - 1) : 1;

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
      // get link
      let th = jQuery (e.target).is ('th') ? jQuery (e.target) : jQuery (e.target).closest ('th');

      // get column
      let column = opts.grid.columns[th.attr ('data-column')];

      // check for id
      if (column.id === opts.grid.sort) {
        // set asc or desc
        if (opts.grid.way === false) {
          // set way
          opts.grid.way = -1;
        } else if (opts.grid.way === -1) {
          // set way
          opts.grid.way = 1;
        } else if (opts.grid.way === 1) {
          // reset sort
          opts.grid.way  = false;
          opts.grid.sort = false;
        }
      } else {
        // set sort
        opts.grid.way  = -1;
        opts.grid.sort = column.id;
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

      // log data
      let res = await fetch (opts.grid.route, {
        'body' : JSON.stringify ({
          'way'    : opts.grid.way,
          'page'   : opts.grid.page,
          'rows'   : opts.grid.rows,
          'sort'   : opts.grid.sort,
          'filter' : opts.grid.filter
        }),
        'method'  : 'post',
        'headers' : {
          'Content-Type': 'application/json'
        },
        'credentials' : 'same-origin'
      });

      // load json
      let data = await res.json ();

      // loop data
      for (var key in data) {
        opts.grid[key] = data[key];
      }

      // set loading
      this.loading = false;

      // update view
      this.update ();
    }

    /**
     * returns columns
     *
     * @return {Array}
     */
    grid () {
      // return columns
      return opts.grid;
    }

    /**
     * on update function
     *
     * @param  {String} 'mount'
     */
    this.on ('mount', () => {
      // set pages
      this.setPages ();

      // update
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
