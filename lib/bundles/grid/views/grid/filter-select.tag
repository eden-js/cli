<grid-filter-select>
  <div class="input-group">
    <label if={ opts.filter.title }>
      { opts.filter.title }
    </label>
    <select if={ opts.filter.options } class={ 'form-control' : true } value={ filterValue () } onchange={ onFilter } />
      <option each={ option, i in opts.filter.options } value={ option.value }>
        { option.name }
      </option>
    </select>
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
</grid-filter-select>
