<main-layout>
    <nav class="navbar navbar-fixed-top navbar-dark bg-inverse">
        <a class="navbar-brand" href="#">
            { opts.title }
        </a>
        <ul class="nav navbar-nav">
            <li class="nav-item active">
                <a class="nav-link" href="#">Home</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#">About</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#">Contact</a>
            </li>
        </ul>
    </nav>
    <div class="container" name="page"></div>

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
