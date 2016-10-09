<grid>
    <div class={ 'grid' : true, 'loading' : !this.loaded }>
        <div class="filters" if={ this.filters.length }>
            <div class="filter form-group" each={ filter, i in this.filters }>
                <label if={ filter.title }>
                    { filter.title }
                </label>
                <input class={ 'form-control' : true } type={ filter.type } data-filter={ filter.id } value={ filterValue (filter) } placeholder={ filter.title } onchange={ onFilter } />
            </div>
        </div>
        <table class={ tableClass () }>
            <thead>
                <tr>
                    <th each={ column, i in this.columns }>
                        { column.title }
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr each={ data, i in this.data }>
                    <td each={ column, a in this.columns }>
                        { console.log (data, data[column.id]) }
                        <raw html={ data[column.id] } />
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="row">
            <div class="col-sm-6">
                <nav aria-label="Page navigation">
                    <ul class="pagination">
                        <li class={ 'page-item' : true, 'disabled' : hasPrev () }>
                            <a class="page-link" href="#!" aria-label="Previous" onclick={ onPrev }>
                                <span aria-hidden="true">&laquo;</span>
                                <span class="sr-only">Previous</span>
                            </a>
                        </li>
                        <li class={ 'page-item' : true, 'active' : this.page === page } each={ page, i in this.pages }>
                            <a class="page-link" href="#!" data-page={ page } onclick={ onPage }>{ page }</a>
                        </li>
                        <li class={ 'page-item' : true, 'disabled' : hasNext () }>
                            <a class="page-link" href="#" aria-label="Next" onclick={ onNext }>
                                <span aria-hidden="true">&raquo;</span>
                                <span class="sr-only">Next</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
            <div class="col-sm-6 text-sm-right">
                <h4>
                    Showing { (this.page - 1) * this.rows } - { (this.page * this.rows) > this.total ? this.total : (this.page * this.rows) } of { this.total }
                </h4>
            </div>
        </div>
    </div>

    <script>
        // set variables
        this.rows    = opts.grid && opts.grid.rows ? opts.grid.rows : 20;
        this.data    = opts.grid && opts.grid.data ? opts.grid.data : [];
        this.page    = opts.grid && opts.grid.page ? opts.grid.page : 1;
        this.route   = opts.grid && opts.grid.route ? opts.grid.route : '';
        this.total   = opts.grid && opts.grid.total ? opts.grid.total : 0;
        this.loaded  = opts.grid || false;
        this.filter  = opts.grid && opts.grid.filter ? opts.grid.filter : {};
        this.filters = opts.grid && opts.grid.filters ? opts.grid.filters : [];
        this.columns = opts.grid && opts.grid.columns ? opts.grid.columns : [];

        // set pages
        this.pages = [];


        /**
         * gets table class
         *
         * @return {String} class
         */
        tableClass () {
            // return string
            return opts.table || 'table table-bordered';
        }

        /**
         * returns filter value
         *
         * @param  {Object} filter
         *
         * @return {String}
         */
        filterValue (filter) {
            // return filter value
            return this.filter[filter.id] || '';
        }

        /**
         * return has previous page
         *
         * @return {Boolean}
         */
        hasPrev () {
            return this.page <= 1;
        }

        /**
         * return has next page
         *
         * @return {Boolean}
         */
        hasNext () {
            return this.page >= Math.floor (this.total / this.rows) + 1;
        }

        /**
         * sets pages
         */
        setPages () {
            // reset pages
            this.pages = [];

            // set start
            var page  = (this.page - 5) < 1 ? 1 : (this.page - 5);
            var main  = page;
            var start = ((page - 1) * this.rows);

            // while start less than pages
            while (start < this.total) {
                // add to pages
                this.pages.push (page);

                // add to page
                page++;

                // set start value
                start = ((page - 1) * this.rows);

                // check if should stop
                if (main - page > 8) {
                    break;
                }
            }
        }

        /**
         * on filter function
         *
         * @param  {Event} e
         */
        onFilter (e) {
            // set filter value
            var filter = e.target.dataset.filter;

            // set filter
            this.filter[filter] = jQuery (e.target).val ();

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
            this.page = e.target.dataset.page;

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
            this.page = this.hasPrev () ? 1 : (this.page - 1);

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
            this.page = this.hasNext () ? (this.page + 1) : this.page;

            // load view
            this.load ();

            // update view
            this.update ();
        }

        /**
         * loads datagrid by params
         */
        load () {
            // set loading
            this.loading = true;

            // update view
            this.update ();

            // log data
            jQuery.ajax ({
                url         : this.route,
                type        : 'post',
                data        : JSON.stringify ({
                    'page' : this.page,
                    'rows' : this.rows,
                    'filter' : this.filter
                }),
                contentType : 'application/json; charset=utf-8',
                traditional : true
            })
                .fail (() => {
                    // set registering to false
                    this.loading = false;

                    // update view
                    this.update ();
                })
                .done ((data) => {
                    // loop data
                    for (var key in data) {
                        this[key] = data[key];
                    }

                    // set loading
                    this.loading = false;

                    // update view
                    this.update ();
                });
        }

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
