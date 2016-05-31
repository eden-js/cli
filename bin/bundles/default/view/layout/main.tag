<main-layout>
    <div name="page"></div>

    /**
     * mount page function

     * @param  {String} page
     */
    mountPage (page) {
      riot.mount(this.page, page, opts);
    }

    /**
     * on update function
     *
     * @param  {String} 'update'
     */
    this.on ('update', () => {
        if (opts.mountPage) {
            this.mountPage (opts.mountPage);
        }
    });

    /**
     * on mount function
     *
     * @param  {String} 'mount'
     */
    this.on ('mount', () => {
        if (opts.mountPage) {
            this.mountPage (opts.mountPage);
        }
    });
</main-layout>
