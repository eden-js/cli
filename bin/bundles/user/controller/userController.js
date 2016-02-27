/**
 * Created by Awesome on 2/21/2016.
 */

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
        super(app);

        // bind methods
        this.authAction      = this.authAction.bind(this);
        this.loginAction     = this.loginAction.bind(this);
        this.loginFormAction = this.loginFormAction.bind(this);

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
                // find user by username
                var User = yield user.where({
                    'username' : username
                }).findOne();
                
                // check user exists
                if (!User) {
                    return done(null, false, {
                        message: 'Username not found'
                    });
                }

                // compare hash with password
                var hash  = User.get('hash');
                var check = crypto.createHmac('sha256', config.secret)
                    .update(password)
                    .digest('hex');

                // check if password correct
                if (check == hash) {
                    return done(null, false, {
                        message: 'Incorrect password'
                    });
                }

                // password accepted
                return done(null, User);
            })
        }));
        // serializes user
        passport.serializeUser(function(user, done) {
            done(user._id); // the user id that you have in the session
        });
        // deserialize user
        passport.deserializeUser(function(id, done) {
            co(function * () {
                var User = yield user.load(id);

                if (User) {
                    done(User);
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
        next();
    }

    /**
     * login action
     *
     * @param req
     * @param res
     *
     * @route {get} /login
     * @menu {{"name":"LOGIN","menu":"MAIN","priority":1}} Login
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
        passport.authenticate('local', function(err, user, info) {
            if (!user) {
                return res.render('login', {
                    'error' : info.message
                });
            }
            res.redirect('/');
        })(req, res, next);
    }
}

/**
 * user controller
 * @type {userController}
 */
module.exports = userController;