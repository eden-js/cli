/**
 * Created by Awesome on 2/27/2016.
 */

module.exports = {
    // title of the app
    title       : 'EdenFrame',
    // the port to run the app
    port        : '3007',
    // the environment to run the app in
    environment : 'dev',
    // secret for crypto
    secret      : 'SECRET',
    // secret for session
    session     : 'SESSION',
    // set threads
    threads     : 10,
    // default acl information
    acl         : {
        // default acl per user
        'default' : {
            name  : 'user',
            level : 0
        },
        // default acl for first user (admin account)
        'first'   : {
            name  : 'admin',
            level : 100
        }
    },
    // database information (mongodb)
    database    : {
        dev : {
            host : 'localhost',
            db   : 'database'
        }
    },
    // default sass files
    sass         : [
        './node_modules/bootstrap/scss/bootstrap-flex.scss',
        './node_modules/tether/src/css/tether.scss',
        './node_modules/toastr/toastr.scss'
    ],
    // default javascript files
    js           : [
        './node_modules/jquery/dist/jquery.min.js',
        './node_modules/tether/dist/js/tether.min.js',
        './node_modules/jquery-bootgrid/dist/jquery.bootgrid.min.js',
        './node_modules/bootstrap/dist/js/bootstrap.js',
        './node_modules/toastr/toastr.js'
    ]
};
