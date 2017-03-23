/**
 * Created by Awesome on 2/21/2016.
 */

// use strict
'use strict';

// require dependencies
const local      = require ('passport-local').Strategy;
const crypto     = require ('crypto');
const socket     = require ('socket');
const passport   = require ('passport');
const controller = require ('controller');

// require models
const user  = model ('user');
const login = model ('login');

// require local dependencies
const acl    = require ('lib/utilities/acl');
const config = require ('config');

/**
 * create user controller
 *
 * @priority 10
 */
class userController extends controller {
  /**
   * constructor for user controller
   *
   * @param {eden} eden
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.build              = this.build.bind (this);
    this.loginAction        = this.loginAction.bind (this);
    this.logoutAction       = this.logoutAction.bind (this);
    this.registerAction     = this.registerAction.bind (this);
    this.loginFormAction    = this.loginFormAction.bind (this);
    this.registerFormAction = this.registerFormAction.bind (this);

    // bind private methods
    this._user         = this._user.bind (this);
    this._login        = this._login.bind (this);
    this._logout       = this._logout.bind (this);
    this._deserialise  = this._deserialise.bind (this);
    this._authenticate = this._authenticate.bind (this);

    // run
    this.build ();
  }

  /**
   * builds user controller
   */
  build () {
    // on render
    this.eden.pre ('view.compile', (render) => {
      // move menus
      if (render.state.user) render.user = render.state.user;

      // delete from state
      delete render.state.user;
    });

    // pre login
    this.eden.on ('user.login',  this._login);
    this.eden.on ('user.logout', this._logout);

    // pre login fail
    this.eden.on ('user.login.fail', this._login);

    // initialize passport
    this.eden.router.use (passport.initialize ());
    this.eden.router.use (passport.session ());

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
    this.eden.router.use (this._user);
  }

  /**
   * login action
   *
   * @param req
   * @param res
   *
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
      if (!User || err) {
        // alert user
        req.alert ('error', err || info.message);

        // emit event
        if (info.user) this.eden.emit ('user.login.fail', {
          'fail'    : true,
          'user'    : info.user,
          'message' : err || info.message
        });

        // render login page
        return res.render ('login', {
          'old'    : req.body,
          'layout' : 'login'
        });
      }

      // do passport login
      req.login (User, {}, async (err) => {
        // emit to socket
        socket.session (req.sessionID, 'user', await User.sanitise ());

        // send alert
        await req.alert ('success', 'Successfully logged in', {
          'save' : true
        });

        // hook user login
        await this.eden.emit ('user.login', {
          'req'  : req,
          'user' : User
        });

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
   * @route    {get} /logout
   * @menu     {MAIN} Logout
   * @acl      true
   * @fail     /
   * @priority 2
   */
  async logoutAction (req, res) {
    // hook user login
    await this.eden.emit ('user.logout', {
      'req'  : req,
      'user' : req.user
    });

    // logout
    req.logout ();

    // emit to socket
    socket.session (req.sessionID, 'user', false);

    // send alert
    await req.alert ('success', 'Successfully logged out', {
      'save' : true
    });

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
      // send alert
      req.alert ('error', 'your username must be at least 5 characters long');

      // render registration page
      return res.render ('register', {
        'old' : req.body
      });
    }

    // check for user
    let User = await user.where ({
      'username' : req.body.username.toLowerCase ()
    }).findOne ();

    // check if user exists
    if (User) {
      // send alert
      req.alert ('error', 'the username "' + req.body.username + '" is already taken');

      // render registration page
      return res.render ('register', {
        'old' : req.body
      });
    }

    // check password length
    if (req.body.password.trim ().length < 5) {
      // send alert
      req.alert ('error', 'your password must be at least 5 characters long');

      // render registration page
      return res.render ('register', {
        'old' : req.body
      });
    }

    // check passwords match
    if (req.body.password != req.body.passwordb) {
      // send alert
      req.alert ('error', 'your passwords do not match');

      // render registration page
      return res.render ('register', {
        'old' : req.body
      });
    }

    // everything checks out
    let hash = crypto.createHmac ('sha256', config.get ('secret'))
        .update (req.body.password)
        .digest ('hex');

    // create user
    User = new user ({
      'hash'     : hash,
      'username' : req.body.username.toLowerCase ()
    });

    // let prevented
    let prevented = false;

    // hook user login
    await this.eden.hook ('user.register', {
      'req'  : req,
      'user' : User
    }, async (obj) => {
      // check error
      if (obj.error) {
        // set prevented
        prevented = true;

        // render
        return res.render ('register', {
          'old' : req.body
        });
      }
    });

    // save user
    await User.save ();

    // log user in
    if (!prevented) req.login (User, async (err) => {
      // send alert
      await req.alert ('success', 'You are now successfully registered', {
        'save' : true
      });

      // hook user login
      await this.eden.emit ('user.login', {
        'req'  : req,
        'user' : User
      });

      // emit to socket
      socket.session (req.sessionID, 'user', await User.sanitise ());

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
    res.locals.user = req.user ? await req.user.sanitise () : false;

    // run next
    next ();
  }

  /**
   * on user login
   *
   * @param {Object} obj
   */
  async _login (obj) {
    // add to login
    let Login = new login ({
      'ip'      : obj.req ? obj.req.headers['x-forwarded-for'] || obj.req.connection.remoteAddress : false,
      'way'     : 'login',
      'fail'    : !!obj.fail,
      'user'    : obj.user,
      'message' : obj.message
    });

    // save login
    await Login.save ();
  }

  /**
   * on user login
   *
   * @param {Object} obj
   */
  async _logout (obj) {
    // add to login
    let Login = new login ({
      'ip'      : obj.req ? obj.req.headers['x-forwarded-for'] || obj.req.connection.remoteAddress : false,
      'way'     : 'logout',
      'fail'    : false,
      'user'    : obj.user,
      'message' : false
    });

    // save login
    await Login.save ();
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
    let User = await user.where ({
      'username' : username.toLowerCase ()
    }).limit (1).find ();

    // check user exists
    if (!User || !User.length) {
      return done (null, false, {
        'user'    : false,
        'message' : 'User not found'
      });
    }

    // set user
    User = User[0];

    // authenticate
    let result = await User.authenticate (password);

    // check error
    if (result !== true) {
      return done (null, false, {
        'user'    : User,
        'message' : result.info
      });
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
    let User = await user.findById (id);

    // callback done with user
    done (null, User);
  }
}

/**
 * eport user controller
 *
 * @type {userController}
 */
exports = module.exports = userController;
