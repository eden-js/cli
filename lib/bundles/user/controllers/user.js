
// require dependencies
const local      = require ('passport-local').Strategy;
const crypto     = require ('crypto');
const socket     = require ('socket');
const passport   = require ('passport');
const controller = require ('controller');

// require models
const acl   = model ('acl');
const user  = model ('user');
const login = model ('login');

// require local dependencies
const email   = helper ('email');
const config  = require ('config');
const aclUtil = require ('lib/utilities/acl');

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
    this.build                = this.build.bind (this);
    this.loginAction          = this.loginAction.bind (this);
    this.logoutAction         = this.logoutAction.bind (this);
    this.registerAction       = this.registerAction.bind (this);
    this.loginSubmitAction    = this.loginSubmitAction.bind (this);
    this.registerSubmitAction = this.registerSubmitAction.bind (this);

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

    // login event listeners
    this.eden.on ('user.login',      this._login);
    this.eden.on ('user.logout',     this._logout);
    this.eden.on ('user.login.fail', this._login);

    // hook listen methods
    this.eden.pre ('user.register', this._register);

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

    // check acl
    this._acl ();
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
  loginSubmitAction (req, res, next) {
    // authenticate with passport
    passport.authenticate ('local', (err, User, info) => {
      // check user exists
      if (!User || err) {
        // alert user
        req.alert ('error', err || info.message);

        // emit event
        this.eden.emit ('user.login.fail', {
          'req'     : req,
          'fail'    : true,
          'user'    : info.user,
          'message' : err || info.message
        });

        // render login page
        return res.render ('login', {
          'old' : req.body
        });
      }

      // do passport login
      req.login (User, {}, async () => {
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
   * Forgot password action
   *
   * @param req
   * @param res
   *
   * @route {get} /forgot
   * @acl   false
   * @fail  /
   */
  async forgotAction (req, res) {
    // check if token
    if (req.query.token) {
      // load user
      let User = await user.findOne ({
        'token' : req.query.token
      });

      // check user
      if (!User) {
        // send alert
        req.alert ('error', 'The token you have sent is invalid');

        // render forgot
        return res.render ('forgot');
      }

      // render reset
      return res.render ('reset', {
        'token' : User.get ('token')
      });
    }

    // render login page
    res.render ('forgot');
  }

  /**
   * Reset password action
   *
   * @param req
   * @param res
   *
   * @route {post} /reset
   * @acl   false
   * @fail  /
   */
  async resetSubmitAction (req, res) {
    // check if token
    if (!req.body.token) return res.redirect ('/forgot');

    // load user
    let User = await user.findOne ({
      'token' : req.body.token
    });

    // check user
    if (!User) {
      // send alert
      req.alert ('error', 'The token you have used is invalid');

      // redirect
      return res.redirect ('/forgot');
    }

    // set password
    if (req.body.password.trim ().length < 5) {
      // send alert
      req.alert ('error', 'Your password must be at least 5 characters long');

      // render registration page
      return res.render ('reset', {
        'token' : req.body.token
      });
    }

    // check passwords match
    if (req.body.password !== req.body.passwordb) {
      // send alert
      req.alert ('error', 'Your passwords do not match');

      // render registration page
      return res.render ('reset', {
        'token' : req.body.token
      });
    }

    // everything checks out
    let hash = crypto.createHmac ('sha256', config.get ('secret'))
        .update (req.body.password)
        .digest ('hex');

    // create user
    User.set ('hash', hash);

    // send alert
    req.alert ('success', 'Successfully updated your password');

    // redirect to login
    res.redirect ('/login');
  }

  /**
   * login form action
   *
   * @param req
   * @param res
   *
   * @route {post} /forgot
   * @acl   false
   * @fail  /
   */
  async forgotSubmitAction (req, res) {
    // load user
    let User = await user.or ({
      'email' : new RegExp (['^', req.body.username, '$'].join (''), 'i')
    }, {
      'username' : new RegExp (['^', req.body.username, '$'].join (''), 'i')
    }).findOne ();

    // check user exists
    if (!User) {
      // send error
      req.alert ('error', 'Username not found');

      // redirect
      return this.forgotAction (req, res);
    }

    // check email
    if (!User.get ('email')) {
      // send alert
      return req.alert ('error', 'User does not have an email');
    }

    // set token
    User.set ('token', crypto.randomBytes (Math.ceil (24 / 2)).toString ('hex').slice (0, 24));

    // save user
    await User.save ();

    // alert
    req.alert ('success', 'An email has been sent with your password reset token');

    // send email
    email.send (User.get ('email') || User.get ('username'), 'forgot', {
      'token'   : User.get ('token'),
      'subject' : config.get ('domain') + ' - forgot password'
    });

    // return redirect
    return res.redirect ('/');
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
  async registerSubmitAction (req, res) {
    // create user
    let User = new user ();

    // check username
    if (req.body.username.trim ().length < 5) {
      // send alert
      req.alert ('error', 'your username must be at least 5 characters long');

      // render registration page
      return res.render ('register', {
        'old' : req.body
      });
    }

    // check email
    if (req.body.email && req.body.email.length) {
      // check email
      let Email = await user.findOne ({
        'email' : new RegExp (['^', req.body.email, '$'].join (''), 'i')
      });

      // if Email
      if (Email) {
        // send alert
        req.alert ('error', 'the email "' + req.body.email + '" is already taken');

        // render registration page
        return res.render ('register', {
          'old' : req.body
        });
      }

      // set email
      User.set ('email', req.body.email);
    }

    // check for user
    let Username = await user.findOne ({
      'username' : new RegExp (['^', req.body.username, '$'].join (''), 'i')
    });

    // check if user exists
    if (Username) {
      // send alert
      req.alert ('error', 'the username "' + req.body.username + '" is already taken');

      // render registration page
      return res.render ('register', {
        'old' : req.body
      });
    }

    // set email
    User.set ('username', req.body.username);

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
    if (req.body.password !== req.body.passwordb) {
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

    // set hash
    User.set ('hash', hash);

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

      // save user
      await User.save ();
    });

    // log user in
    if (!prevented) req.login (User, async () => {
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
    res.locals.acl  = await aclUtil.list (req.user);
    res.locals.user = req.user ? await req.user.sanitise () : false;

    // run next
    next ();
  }

  /**
   * checks acl exists
   *
   * @return {Promise}
   */
  async _acl () {
    // create test array
    let load = [...config.get ('acl.default'), ...config.get ('acl.admin')];

    // check acls
    for (let i = 0; i < load.length; i++) {
      // load acl
      let check = await acl.count ({
        'name' : load[i].name
      });

      // creat if not exists
      if (!check) {
        // set create
        let create = new acl (load[i]);

        // save
        await create.save ();
      }
    }
  }

  /**
   * on user login
   *
   * @param {Object} obj
   */
  async _login (obj) {
    // add to login
    let Login = new login ({
      'ip'      : obj.req ? obj.req.headers['x-forwarded-for'] || obj.req.connection.remoteAddress.replace (/^.*:/, '') : false,
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
  async _register (obj) {
    // load user
    let Acls = config.get ('acl.default') || [];
    let acls = [];
    let User = obj.user;

    // check acls
    let count = await user.count ();

    // add admin roles
    if (count === 1) {
      Acls.push (...config.get ('acl.admin'));
    }

    // load acls
    for (let i = 0; i < Acls.length; i++) {
      // load acl
      let check = await acl.findOne ({
        'name' : Acls[i].name
      });

      // check check
      if (check) acls.push (check);
    }

    // set acls
    User.set ('acls', acls);
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
    let User = await user.or ({
      'username' : new RegExp (['^', username, '$'].join (''), 'i')
    }, {
      'email' : new RegExp (['^', username, '$'].join (''), 'i')
    }).findOne ();

    // check user exists
    if (!User) {
      return done (null, false, {
        'user'    : false,
        'message' : 'User not found'
      });
    }

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
