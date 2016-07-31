/**
 * Created by Awesome on 2/21/2016.
 */

// use strict
'use strict';

// require local dependencies
var acl        = require ('acl');
var user       = require ('user');
var aclConfig  = require (global.appRoot + '/app/cache/config.json').acl;

// require dependencies
var co         = require ('co');
var url        = require ('url');
var local      = require ('passport-local').Strategy;
var config     = require ('config');
var crypto     = require ('crypto');
var aclUtil    = require ('acl-util');
var passport   = require ('passport');
var controller = require ('controller');

/**
 * create user controller
 */
class main extends controller {
    /**
     * constructor for main controller
     *
     * @param {eden} eden
     */
    constructor (eden) {
        // run super
        super (eden);

        // bind methods
        this.loginAction        = this.loginAction.bind (this);
        this.logoutAction       = this.logoutAction.bind (this);
        this.loginFormAction    = this.loginFormAction.bind (this);
        this.registerAction     = this.registerAction.bind (this);
        this.registerFormAction = this.registerFormAction.bind (this);

        // build methods
        this.build = this.build.bind (this);

        // run
        this.build (eden.app);
    }

    /**
     * builds user controller
     */
    build (app) {
        // initialize passport
        app.use (passport.initialize ());
        app.use (passport.session ());

        // create local strategy
        passport.use (new local ((username, password, done) => {
            // run coroutine
            co (function * () {
                // find user
                var User = yield user.where ({
                    'username' : username.toLowerCase ()
                }).findOne ();

                // check user exists
                if (!User) {
                    return done (null, false, 'User not found');
                }

                // authenticate
                var result = yield User.authenticate (password);

                // check error
                if (result.error) {
                    return done (null, false, result.mess);
                }

                // send done
                done (null, User);
            });
        }));

        // serializes user
        passport.serializeUser ((User, done) => {
            // emit done
            done (null, User.get ('_id').toString ());
        });

        // deserialize user
        passport.deserializeUser ((id, done) => {
            // run coroutine
            co (function * () {
                // find user by id
                var User = yield user.findById (id);

                // callback done with user
                done (null, User);
            });
        });

        // add user to locals
        app.use ((req, res, next) => {
            // run coroutine
            co (function * () {
                // get acls
                var aclArr = [];
                var acls   = [];

                // check for req user
                if (req.user) {
                    acls = yield req.user.model ('acl');
                }

                // loop acls for acl array
                for (var i = 0; i < acls.length; i++) {
                    aclArr.push (acls[i].sanitise ());
                }

                // set user locally
                res.locals.acl  = aclArr;
                res.locals.user = req.user ? req.user.sanitise () : false;

                // run next
                next ();
            });
        });

        // check acl on run
        app.use ((req, res, next) => {
            // do route regex
            var rt = '/' + res.locals.route.replace (/^\/|\/$/g, '');

            // check route has acl
            if (!aclConfig[rt] || !aclConfig[rt].length) {
                // return next
                return next ();
            }

            // loop acl for tests
            for (var i = 0; i < aclConfig[rt].length; i ++) {
                // check acl
                var check = aclUtil.acl (res.locals.acl, aclConfig[rt][i], res.locals.user);

                // check if true
                if (check !== true) {
                    // check if redirect
                    if (check.redirect) {
                        // redirect to fail auth redirect
                        return res.redirect (check.redirect);
                    }

                    // redirect home
                    return res.redirect ('/');
                }
            }

            // do next
            next ();
        });
    }

    /**
     * login action
     *
     * @param req
     * @param res
     *
     * @name     LOGIN
     * @route    {get} /login
     * @menu     {MAIN} Login
     * @acl      {test:false,fail:{redirect:"/"}}
     * @priority 2
     */
    loginAction (req, res) {
        // render login page
        res.render ('login', {});
    }

    /**
     * login form action
     *
     * @param req
     * @param res
     *
     * @route {post} /login
     * @acl   {test:false,fail:{redirect:"/"}}
     */
    loginFormAction (req, res, next) {
        // authenticate with passport
        passport.authenticate ('local', (err, User, info) => {
            // check user exists
            if (!User) {
                // render login page
                return res.render ('login', {
                    'error' : info.message,
                    'old'   : req.body
                });
            }

            // do passport login
            req.login (User, {}, (err) => {
                // redirect to home
                res.redirect ('/');
            });
        }) (req, res, next);
    }

    /**
     * logout action
     *
     * @param req
     * @param res
     *
     * @name     LOGOUT
     * @route    {get} /logout
     * @menu     {MAIN} Logout
     * @acl      {test:true,fail:{redirect:"/"}}
     * @priority 2
     */
    logoutAction (req, res) {
        // logout
        req.logout ();
        // redirect to home
        res.redirect ('/');
    }

    /**
     * Register action
     *
     * @param req
     * @param res
     *
     * @route {get} /register
     * @acl   {test:false,fail:{redirect:"/"}}
     */
    registerAction (req, res) {
        // render registration page
        res.render ('register', {});
    }

    /**
     * Register form action
     *
     * @param req
     * @param res
     *
     * @route {post} /register
     * @acl   {test:false,fail:{redirect:"/"}}
     */
    registerFormAction (req, res) {
        // run coroutine
        co (function * () {
            // check username
            if (req.body.username.trim ().length < 5) {
                // render registration page
                return res.render ('register', {
                    'error' : 'your username must be at least 5 characters long',
                    'old'   : req.body
                });
            }

            // check for user
            var User = yield user.where ({
                'username' : req.body.username.toLowerCase ()
            }).findOne ();

            // check if user exists
            if (User) {
                // render registration page
                return res.render ('register', {
                    'error' : 'the username "' + req.body.username + '" is already taken',
                    'old'   : req.body
                });
            }

            // check password length
            if (req.body.password.trim ().length < 5) {
                // render registration page
                return res.render ('register', {
                    'error' : 'your password must be at least 5 characters long',
                    'old'   : req.body
                });
            }

            // check passwords match
            if (req.body.password != req.body.passwordb) {
                // render registration page
                return res.render ('register', {
                    'error' : 'your passwords do not match',
                    'old'   : req.body
                });
            }

            // everything checks out
            var hash = crypto.createHmac ('sha256', config.secret)
                .update (req.body.password)
                .digest ('hex');

            // create user
            User = new user ({
                'username' : req.body.username.toLowerCase (),
                'hash'     : hash
            });

            // save user
            yield User.save ();

            // log user in
            req.login (User, (err) => {
                // redirect to home
                res.redirect ('/');
            });
        });
    }
}

/**
 * eport user controller
 *
 * @type {main}
 */
module.exports = main;
