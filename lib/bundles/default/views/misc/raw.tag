<raw>
  <script>
    /**
     * Update raw html on mount
     *
     * @type {Event} 'mount'
     */
    this.on ('mount', () => {
      if (this.root) this.root.innerHTML = ((opts.data || {}).html || opts.html || '').toString ();
    });

    /**
     * Update raw html on update
     *
     * @type {Event} 'update'
     */
    this.on ('update', () => {
      if (this.root) this.root.innerHTML = ((opts.data || {}).html || opts.html || '').toString ();
    });
  </script>
</raw>
