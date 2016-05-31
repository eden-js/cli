<main-layout>
    <nav class="navbar navbar-fixed-top navbar-dark bg-inverse">
        <a class="navbar-brand" href="#">
            { opts.title }
        </a>
        <ul class="nav navbar-nav">
            <li class="nav-item active">
                <a class="nav-link" href="#" onclick={ onHome }>Home</a>
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
     * on home function
     */
    onHome () {
        alert ('working');
    }

    /**
     * mount page function
     */
    mountPage () {
        if (opts.mountPage) {
            riot.mount (this.page, opts.mountPage, opts);
        }
    }

    /**
     * on mount function
     *
     * @param  {String} 'mount'
     */
    this.on ('update mount', () => {
        // mount page on update/mount
        this.mountPage ();
    });
</main-layout>
