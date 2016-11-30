/**
 * Created by Awesome on 2/21/2016.
 */

// use strict
'use strict';

// require dependencies
var acl        = require ('acl');
var local      = require ('passport-local').Strategy;
var crypto     = require ('crypto');
var passport   = require ('passport');
var controller = require ('controller');

// require local dependencies
var user   = require ('user/models/user');
var config = require ('app/config');

/**
 * create user controller
 */
class userController extends controller {
  /**
   * constructor for user controller
   *
   * @param {eden} eden
   */
  constructor (eden) {
    // run super
    super (eden);

    // bind methods
    this.build              = this.build.bind (this);
    this.loginAction        = this.loginAction.bind (this);
    this.logoutAction       = this.logoutAction.bind (this);
    this.registerAction     = this.registerAction.bind (this);
    this.loginFormAction    = this.loginFormAction.bind (this);
    this.registerFormAction = this.registerFormAction.bind (this);

    // bind private methods
    this._user         = this._user.bind (this);
    this._deserialise  = this._deserialise.bind (this);
    this._authenticate = this._authenticate.bind (this);

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
    passport.use (new local (this._authenticate));

    // serializes user
    passport.serializeUser ((User, done) => {
      // emit done
      done (null, User.get ('_id').toString ());
    });

    // deserialize user
    passport.deserializeUser (this._deserialise);

    // add user to locals
    app.use (this._user);
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
   * @acl      false
   * @fail     /
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
   * @acl   false
   * @fail  /
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
   * @acl      true
   * @fail     /
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
   * @acl   false
   * @fail  /
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
   * @acl   false
   * @fail  /
   */
  async registerFormAction (req, res) {
    // check username
    if (req.body.username.trim ().length < 5) {
      // render registration page
      return res.render ('register', {
        'error' : 'your username must be at least 5 characters long',
        'old'   : req.body
      });
    }

    // check for user
    var User = await user.where ({
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
    await User.save ();

    // log user in
    req.login (User, (err) => {
      // redirect to home
      res.redirect ('/');
    });
  }

  /**
   * adds user to locals
   *
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  async _user (req, res, next) {
    // set user locally
    res.locals.acl  = await acl.list (req.user);
    res.locals.user = req.user ? req.user.sanitise () : false;

    // run next
    next ();
  }

  /**
   * authenticate user function
   *
   * @param {String} username
   * @param {String} password
   * @param {Function} done
   */
  async _authenticate (username, password, done) {
    // find user
    var User = await user.where ({
      'username' : username.toLowerCase ()
    }).limit (1).find ();

    // check user exists
    if (!User || !User.length) {
      return done (null, false, 'User not found');
    }

    // set user
    User = User[0];

    // authenticate
    var result = await User.authenticate (password);

    // check error
    if (result !== true) {
      return done (null, false, result.info);
    }

    // send done
    done (null, User);
  }

  /**
   * deserialize user
   *
   * @param {String} id
   * @param {Function} done
   */
  async _deserialise (id, done) {
    // find user by id
    var User = await user.findById (id);

    // callback done with user
    done (null, User);
  }
}

/**
 * eport user controller
 *
 * @type {userController}
 */
module.exports = userController;
