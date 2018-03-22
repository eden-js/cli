<raw>

  <script>

    /**
     * update raw html on create
     *
     * @type {Event} 'update'
     */
    this.on ('mount', () => {
      if (this.root) this.root.innerHTML = ((opts.data || {}).html || opts.html || '').toString ();
    });

    /**
     * update raw html on create
     *
     * @type {Event} 'update'
     */
    this.on ('update', () => {
      if (this.root) this.root.innerHTML = ((opts.data || {}).html || opts.html || '').toString ();
    });
  </script>
</raw>
