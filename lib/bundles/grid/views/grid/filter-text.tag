<grid-filter-text>
  <div class="form-group">
    <label if={ opts.filter.title }>
      { opts.filter.title }
    </label>

    <input class={ 'form-control' : true } type="text" value={ filterValue() } onchange={ onFilter } required />
  </div>
  <script>

    /**
     * Returns filter value
     *
     * @param  {object} filter
     *
     * @return {string}
     */
    filterValue () {
      // Return filter value
      return (opts.values || {})[opts.filter.id] || '';
    }

    /**
     * On filter function
     *
     * @param {Event} e
     */
    onFilter (e) {
      // Send to opts
      if (opts.onFilter) opts.onFilter(opts.filter, e.target.value);
    }
  </script>
</grid-filter-text>
