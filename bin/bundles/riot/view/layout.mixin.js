// check for riot
if (!riot) {
    var riot = require ('riot');
}

// create mixin
riot.mixin ('layout', {
    init: function () {
        // on update/mount events
        this.on ('update', () => {
            // mount page on load
            if (this.opts.mountPage) riot.mount (this.page, this.opts.mountPage, this.opts);
        });
        // on updated
        this.on ('updated', () => {
            // check for jQuery
            if (typeof jQuery !== 'undefined') {
                jQuery ('body').trigger ('layout');
            }
        });
    },

    getOpts: function () {
        // return ops
        return this.opts;
    },

    setOpts: function (opts, update) {
        // set ops
        this.opts = opts;

        // update view
        if (update) this.update ();

        // return tag instance
        return this;
    }
});
