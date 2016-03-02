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
    }
};
