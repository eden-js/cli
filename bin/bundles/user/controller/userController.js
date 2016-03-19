/**
 * Created by Awesome on 2/21/2016.
 */

    // use strict
'use strict';

// require local dependencies
var controller = require (global.appRoot + '/bin/bundles/core/controller');
var user       = require (global.appRoot + '/bin/bundles/user/model/user');
var acl        = require (global.appRoot + '/bin/bundles/user/model/acl');
var aclConfig  = require (global.appRoot + '/cache/config.json').acl;
var test       = require (global.appRoot + '/bin/acl');
var config     = require (global.appRoot + '/config');

// require dependencies
var co       = require ('co');
var crypto   = require ('crypto');
var passport = require ('passport');
var local    = require ('passport-local').Strategy;

/**
 * create user controller
 */
class userController extends controller {
    /**
     * constructor for user controller
     *
     * @param app
     */
    constructor (app) {
        // run super
        super (app);

        // bind methods
        this.loginAction        = this.loginAction.bind (this);
        this.logoutAction       = this.logoutAction.bind (this);
        this.loginFormAction    = this.loginFormAction.bind (this);
        this.registerAction     = this.registerAction.bind (this);
        this.registerFormAction = this.registerFormAction.bind (this);

        // build methods
        this.build = this.build.bind (this);

        // run
        this.build (app);
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
            co (function * () {
                // find user
                var User = yield user.where ({
                    'username' : username
                }).findOne ();

                // check user exists
                if (! User) {
                    return done (null, false, 'User not found');
                }

                // authenticate
                User.authenticate (password).then (result => {
                    if (result.error) {
                        return done (null, false, result.mess);
                    }
                    done (null, User);
                });
            });
        }));

        // serializes user
        passport.serializeUser ((User, done) => {
            done (null, User.get ('_id').toString ());
        });

        // deserialize user
        passport.deserializeUser ((id, done) => {
            co (function * () {
                var User = yield user.findById (id);

                if (User) {
                    done (null, User);
                } else {
                    done (null, false);
                }
            });
        });

        // add user to locals
        app.use ((req, res, next) => {
            // set user locally
            res.locals.user      = req.user;
            res.locals.eden.user = req.user ? {
                'id'       : req.user.get('_id').toString(),
                'username' : req.user.get('username'),
                'avatar'   : req.user.get('avatar')
            } : false;

            // run next
            return next ();
        });

        // check acl on run
        app.use ((req, res, next) => {
            co (function * () {
                // do route regex
                var rt = '/' + req.url.replace (/^\/|\/$/g, '');

                // check route has acl
                if (aclConfig[rt] && aclConfig[rt].length) {
                    // loop acl for tests
                    for (var i = 0; i < aclConfig[rt].length; i ++) {
                        // check acl
                        var check = yield test.test (aclConfig[rt][i], res.locals.user);

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
                }

                // do next
                next ();
            });
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
        res.render ('login', {});
    }

    /**
     * login form action
     *
     * @param req
     * @param res
     *
     * @route {post} /login
     */
    loginFormAction (req, res, next) {
        passport.authenticate ('local', (err, User, info) => {
            if (! User) {
                return res.render ('login', {
                    'error' : info.message,
                    'old'   : req.body
                });
            }
            req.login (User, {}, (err) => {
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
        req.logout ();
        res.redirect ('/');
    }

    /**
     * Register action
     *
     * @param req
     * @param res
     *
     * @route {get} /register
     */
    registerAction (req, res) {
        res.render ('register', {});
    }

    /**
     * Register form action
     *
     * @param req
     * @param res
     *
     * @route {post} /register
     */
    registerFormAction (req, res) {
        co (function * () {
            // check username
            if (req.body.username.trim ().length < 5) {
                return res.render ('register', {
                    'error' : 'your username must be at least 5 characters long',
                    'old'   : req.body
                });
            }

            // check for user
            var User = yield user.where ({
                'username' : req.body.username
            }).findOne ();

            // check if user exists
            if (User) {
                return res.render ('register', {
                    'error' : 'the username "' + req.body.username + '" is already taken',
                    'old'   : req.body
                });
            }

            // check password length
            if (req.body.password.trim ().length < 5) {
                return res.render ('register', {
                    'error' : 'your password must be at least 5 characters long',
                    'old'   : req.body
                });
            }

            // check passwords match
            if (req.body.password != req.body.passwordb) {
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
                'username' : req.body.username,
                'hash'     : hash
            });

            // save user
            yield User.save ();

            // log user in
            req.login (User, (err) => {
                res.redirect ('/');
            });
        });
    }
}

/**
 * eport user controller
 *
 * @type {userController}
 */
module.exports = userController;
