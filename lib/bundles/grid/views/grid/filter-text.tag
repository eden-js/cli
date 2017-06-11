<grid-filter-text>
  <div class="form-group">
    <label if={ opts.filter.title }>
      { opts.filter.title }
    </label>
    <input class={ 'form-control' : true } type="text" value={ filterValue () } onchange={ onFilter } required />
  </div>
  <script>

    /**
     * returns filter value
     *
     * @param  {Object} filter
     *
     * @return {String}
     */
    filterValue () {
      // return filter value
      return opts.values[opts.filter.id] || '';
    }

    /**
     * on filter function
     *
     * @param  {Event} e
     */
    onFilter (e) {
      // send to opts
      if (opts.onfilter) opts.onfilter (opts.filter, e.target.value);
    }

  </script>
</grid-filter-text>
