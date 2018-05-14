<grid-filter-select>
  <div class="form-group">
    <label if={ opts.filter.title }>
      { opts.filter.title }
    </label>

    <select if={ opts.filter.options } class={ 'form-control' : true } onchange={ onFilter }>
      <option each={ option, i in opts.filter.options } value={ option.value } selected={ option.value === filterValue () }>
        { option.name }
      </option>
    </select>
  </div>

  <script>
    /**
     * Returns filter value
     *
     * @param  {Object} filter
     *
     * @return {String}
     */
    filterValue () {
      // Return filter value
      return (opts.values || {})[opts.filter.id] || false;
    }

    /**
     * On filter function
     *
     * @param  {Event} e
     */
    onFilter (e) {
      // Send to opts
      if (opts.onFilter) opts.onFilter (opts.filter, e.target.value);
    }
  </script>
</grid-filter-select>
