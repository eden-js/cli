<raw>
  <script>

    /**
     * update raw html on create
     *
     * @type {Event} 'update'
     */
    this.on ('mount', () => {
      this.root.innerHTML = opts.html || '';
    });

    /**
     * update raw html on create
     *
     * @type {Event} 'update'
     */
    this.on ('update', () => {
      this.root.innerHTML = opts.html || '';
    });
  </script>
</raw>
