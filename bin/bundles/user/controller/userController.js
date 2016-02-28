/**
 * Created by Awesome on 2/21/2016.
 */

// use strict
'use strict';

// require local dependencies
var controller = require(global.appRoot + '/bin/bundles/core/controller');
var user       = require(global.appRoot + '/bin/bundles/user/model/user');
var config     = require(global.appRoot + '/config');

// require dependencies
var co       = require('co');
var crypto   = require('crypto');
var passport = require('passport');
var local    = require('passport-local').Strategy;

/**
 * create user controller
 */
class userController extends controller {
    /**
     * constructor for user controller
     *
     * @param app
     */
    constructor(app) {
        // run super
        super(app);

        // bind methods
        this.authAction         = this.authAction.bind(this);
        this.loginAction        = this.loginAction.bind(this);
        this.loginFormAction    = this.loginFormAction.bind(this);
        this.registerAction     = this.registerAction.bind(this);
        this.registerFormAction = this.registerFormAction.bind(this);

        // build methods
        this.build = this.build.bind(this);

        // run
        this.build(app);
    }

    /**
     * builds user controller
     */
    build(app) {
        // initialize passport
        app.use(passport.initialize());
        app.use(passport.session());

        // create local strategy
        passport.use(new local((username, password, done) => {
            co(function * () {
                // find user
                var User = yield user.where({
                    'username' : username
                }).findOne();

                // check user exists
                if (!User) {
                    return done(null, false, 'User not found');
                }

                // authenticate
                User.authenticate(password).then(result => {
                    if (result.error) {
                        done(null, false, result.mess);
                    } else {
                        done(null, User);
                    }
                });
            });
        }));

        // serializes user
        passport.serializeUser((User, done) => {
            done(null, User.get('_id').toString());
        });

        // deserialize user
        passport.deserializeUser((id, done) => {
            co(function * () {
                var User = yield user.findById(id);

                if (User) {
                    done(null, User);
                } else {
                    done(false);
                }
            });
        });
    }

    /**
     * auth action
     *
     * @param req
     * @param res
     * @param next
     *
     * @priority 1
     * @route {all} /*
     */
    authAction(req, res, next) {
        // set user locally
        res.locals.user = req.user;

        // run next
        next();
    }

    /**
     * login action
     *
     * @param req
     * @param res
     *
     * @route {get} /login
     * @menu {{"name":"LOGIN","menu":"MAIN","when":"!user","priority":1}} Login
     */
    loginAction(req, res) {
        res.render('login', {});
    }

    /**
     * login form action
     *
     * @param req
     * @param res
     *
     * @route {post} /login
     */
    loginFormAction(req, res, next) {
        passport.authenticate('local', (err, User, info) => {
            if (!User) {
                return res.render('login', {
                    'error' : info.message,
                    'old'   : req.body
                });
            }
            req.login(User, {}, (err) => {
                res.redirect('/');
            });
        })(req, res, next);
    }

    /**
     * Register action
     *
     * @param req
     * @param res
     *
     * @route {get} /register
     */
    registerAction(req, res) {
        res.render('register', {});
    }

    /**
     * Register form action
     *
     * @param req
     * @param res
     *
     * @route {post} /register
     */
    registerFormAction(req, res) {
        co(function * () {
            // check username
            if (req.body.username.trim().length < 5) {
                return res.render('register', {
                    'error' : 'your username must be at least 5 characters long',
                    'old'   : req.body
                });
            }

            // check for user
            var User = yield user.where({
                'username' : req.body.username
            }).findOne();

            // check if user exists
            if (User) {
                return res.render('register', {
                    'error' : 'the username "' + req.body.username + '" is already taken',
                    'old'   : req.body
                });
            }

            // check password length
            if (req.body.password.trim().length < 5) {
                return res.render('register', {
                    'error' : 'your password must be at least 5 characters long',
                    'old'   : req.body
                });
            }

            // check passwords match
            if (req.body.password != req.body.passwordb) {
                return res.render('register', {
                    'error' : 'your passwords do not match',
                    'old'   : req.body
                });
            }

            // everything checks out
            var hash = crypto.createHmac('sha256', config.secret)
                .update(req.body.password)
                .digest('hex');

            // create user
            User = new user({
                'username' : req.body.username,
                'hash'     : hash
            });

            // save user
            yield User.save();

            // log user in
            req.login(User, (err) => {
                res.redirect('/');
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