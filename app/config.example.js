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
config.title  = 'EdenJS';

// set application domain
config.domain = 'edenjs.com';

// set application version
config.version = '0.01';


/**
 * set application server configuration
 */

// set starting port
config.port = '3001';

// set amount of instances to run
// setting this as null will count your CPU cores
config.threads = 1;

// websocket configuration
config.socket = {
    'url'    : '//' + config.domain,
    'params' : {
        secure    : true,
        reconnect : true
    }
};

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
        db   : 'edenjs'
    },
    // set live database
    live : {
        host : 'localhost',
        db   : 'edenjs'
    }
};

/**
 * set email transport configuration
 */

// set SMTP config email object
config.email = {
    'service' : 'Zoho',
    'auth'    : {
        'user' : 'email@domain.com',
        'pass' : 'supersecretemailpassword'
    }
};

/**
 * set included files
 */

// set scss imports
// these are imported into app.min.css by default
config.sass = [
    './node_modules/bootstrap/scss/bootstrap.scss',
    './node_modules/tether/src/css/tether.scss',
    './node_modules/toastr/toastr.scss'
];

// set js imports
// these are imported into app.min.js at the top
config.js = [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/tether/dist/js/tether.min.js',
    './node_modules/toastr/build/toastr.min.js',
    './node_modules/bootstrap/dist/js/bootstrap.js'
];


/**
 * set application session secret
 */

// secret for crypto
config.secret = 'someStrongSecretHash';

// secret for session
config.session = 'someStrongSessionHash';


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
     'include' : {
         // include riot module
         'riot'    : 'riot',
         // include alert module
         'alert'   : 'alert/public/js/alert',
         // include socket module
         'socket'  : 'socket/public/js/bootstrap',
         // require history
         'history' : 'history'
     }
 };

/**
 * set misc settings
 */

// create log level setting
config.logLevel = 'info';

/**
 * export config
 *
 * @type {Object}
 */
module.exports = config;
