/**
 * Created by Awesome on 2/27/2016.
 */

/**
 * create initial config Object
 *
 * @type {Object}
 */
var config = {};


/**
 * set application page information
 */

// set application title
config.title  = 'Baseplan API';

// set application domain
config.domain = 'baseplan.api.dev';


/**
 * set application server configuration
 */

// set starting port
config.port = '3001';

// set amount of instances to run
// setting this as null will count your CPU cores
config.threads = 1;

// should the app use websockets
config.socket = true;

// set app environment
config.environment = 'dev';


/**
 * set database configuration
 */

// set config database object
config.database = {
    // dev database
    dev : {
        host : 'localhost',
        db   : 'baseplanApi'
    },
    // set live database
    live : {
        host : 'localhost',
        db   : 'baseplanApi'
    }
};


/**
 * set included files
 */

// set scss imports
// these are imported into app.min.css by default
config.sass = [
    './node_modules/bootstrap/scss/bootstrap-flex.scss',
    './node_modules/tether/src/css/tether.scss'
];

// set js imports
// these are imported into app.min.js at the top
config.js = [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/tether/dist/js/tether.min.js',
    './node_modules/jquery-bootgrid/dist/jquery.bootgrid.min.js',
    './node_modules/bootstrap/dist/js/bootstrap.js'
];


/**
 * set application session secret
 */

// secret for crypto
config.secret = 'x:.+o85I6d6b1N1wrU.2*~I1299Hg23Hf^H1pRX5t!UAqR.T5S';

// secret for session
config.session = 'x:.+o85I6d6b1N1wrU.2*~I1299Hg23Hf^H1pRX5t!UAqR.T5S';


/**
 * set default ACL information
 */

// set acl object
config.acl = {
    // default acl per user
    'default' : {
        name  : 'user',
        value : [
            'loggedIn'
        ]
    },
    // default acl for first user (admin)
    'first'   : {
        name  : 'admin',
        value : true
    }
};


/**
 * set view import functionality
 */

// create view object
config.view = {
    // modules will be required at the top of riots tags.min.js
    'include' : [
        // include riot module
        'riot',
        // include socket module
        'socket'
    ]
};

/**
 * export config
 *
 * @type {Object}
 */
module.exports = config;
