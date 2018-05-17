
// Require dependencies
const local       = require('passport-local').Strategy;
const crypto      = require('crypto');
const config      = require('config');
const socket      = require('socket');
const passport    = require('passport');
const controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// Require models
const acl   = model('acl');
const user  = model('user');
const login = model('login');

// Require local dependencies
const email     = helper('email');
const aclHelper = helper('user/acl');

/**
 * Create user controller
 *
 * @priority 10
 */
class userController extends controller {

  /**
   * Constructor for user controller
   *
   * @param {eden} eden
   */
  constructor () {
    // Run super
    super();

    // Bind methods
    this.build                = this.build.bind(this);
    this.loginAction          = this.loginAction.bind(this);
    this.logoutAction         = this.logoutAction.bind(this);
    this.refreshAction        = this.refreshAction.bind(this);
    this.registerAction       = this.registerAction.bind(this);
    this.loginSubmitAction    = this.loginSubmitAction.bind(this);
    this.registerSubmitAction = this.registerSubmitAction.bind(this);

    // Bind private methods
    this._user         = this._user.bind(this);
    this._login        = this._login.bind(this);
    this._logout       = this._logout.bind(this);
    this._deserialise  = this._deserialise.bind(this);
    this._authenticate = this._authenticate.bind(this);

    // Run
    this.build();
  }

  /**
   * Builds user controller
   */
  build () {
    // On render
    this.eden.pre('view.compile', (render) => {
      // Move menus
      if (render.state.user) render.user = render.state.user;

      // Delete from state
      delete render.state.user;
    });

    // Login event listeners
    this.eden.on('user.login',      this._login);
    this.eden.on('user.logout',     this._logout);
    this.eden.on('user.login.fail', this._login);

    // Hook listen methods
    this.eden.pre('user.register', this._register);

    // Initialize passport
    this.eden.router.use(passport.initialize());
    this.eden.router.use(passport.session());

    // Create local strategy
    passport.use(new local(this._authenticate));

    // Serializes user
    passport.serializeUser((User, done) => {
      // Emit done
      done(null, User.get('_id').toString());
    });

    // Deserialize user
    passport.deserializeUser(this._deserialise);

    // Add user to locals
    this.eden.router.use(this._user);

    // Check acl
    this._acl();
  }

  /**
   * Refresh user action
   *
   * @param  {Object}  opts
   *
   * @call user.refresh
   *
   * @return {Promise}
   */
  async refreshAction (opts) {
    // Return opts
    if (opts.user) {
      // Sanitise user
      return await opts.user.sanitise();
    } else {
      return null;
    }
  }

  /**
   * Login action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @acl      false
   * @fail     /
   * @menu     {MAIN} Login
   * @title    Login
   * @route    {get} /login
   * @priority 2
   */
  loginAction (req, res) {
    // Render login page
    res.render('login', {
      'redirect' : req.query.redirect || false
    });
  }

  /**
   * Login form action
   *
   * @param {Request}  req
   * @param {Response} res
   * @param {Function} next
   *
   * @acl   false
   * @fail  /
   * @title Login
   * @route {post} /login
   */
  loginSubmitAction (req, res, next) {
    // Authenticate with passport
    passport.authenticate('local', (err, User, info) => {
      // Check user exists
      if (!User || err) {
        // Alert user
        req.alert('error', err || info.message);

        // Emit event
        this.eden.emit('user.login.fail', {
          'req'     : req,
          'fail'    : true,
          'user'    : info.user,
          'message' : err || info.message
        });

        // Render login page
        return res.render('login', {
          'old'      : req.body,
          'redirect' : (req.query || {}).redirect || req.body.redirect || false
        });
      }

      // Do passport login
      req.login(User, {}, async () => {
        // Emit to socket
        socket.session(req.sessionID, 'user', await User.sanitise());

        // Send alert
        await req.alert('success', 'Successfully logged in', {
          'save' : true
        });

        // Hook user login
        await this.eden.emit('user.login', {
          'req'  : req,
          'user' : User
        });

        // Redirect to home
        res.redirect((req.query || {}).redirect || req.body.redirect || '/');
      });
    })(req, res, next);
  }

  /**
   * Forgot password action
   *
   * @param {Request}  req}
   * @param {Response} res}
   *
   * @acl   false
   * @fail  /
   * @title Forgot Password
   * @route {get} /forgot
   *
   * @return {*}
   */
  async forgotAction (req, res) {
    // Check if token
    if (req.query.token) {
      // Load user
      let User = await user.findOne({
        'token' : req.query.token
      });

      // Check user
      if (!User) {
        // Send alert
        req.alert('error', 'The token you have sent is invalid');

        // Render forgot
        return res.render('forgot');
      }

      // Render reset
      return res.render('reset', {
        'token' : User.get('token')
      });
    }

    // Render login page
    res.render('forgot');
  }

  /**
   * Reset password action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @acl   false
   * @fail  /
   * @title Reset Password
   * @route {post} /reset
   *
   * @return {*}
   */
  async resetSubmitAction (req, res) {
    // Check if token
    if (!req.body.token) return res.redirect('/forgot');

    // Load user
    let User = await user.findOne({
      'token' : req.body.token
    });

    // Check user
    if (!User) {
      // Send alert
      req.alert('error', 'The token you have used is invalid');

      // Redirect
      return res.redirect('/forgot');
    }

    // Set password
    if (req.body.password.trim().length < 5) {
      // Send alert
      req.alert('error', 'Your password must be at least 5 characters long');

      // Render registration page
      return res.render('reset', {
        'token' : req.body.token
      });
    }

    // Check passwords match
    if (req.body.password !== req.body.passwordb) {
      // Send alert
      req.alert('error', 'Your passwords do not match');

      // Render registration page
      return res.render('reset', {
        'token' : req.body.token
      });
    }

    // Everything checks out
    let hash = crypto.createHmac('sha256', config.get('secret'))
      .update(req.body.password)
      .digest('hex');

    // Create user
    User.set('hash', hash);

    // Save user
    await User.save();

    // Send alert
    req.alert('success', 'Successfully updated your password');

    // Redirect to login
    res.redirect('/login');
  }

  /**
   * Login form action
   *
   * @param {Request} req
   * @param {Response} res
   *
   * @returns {*}
   *
   * @acl   false
   * @fail  /
   * @title Forgot Password
   * @route {post} /forgot
   */
  async forgotSubmitAction (req, res) {
    // Load user
    let User = await user.or({
      'email' : new RegExp(['^', escapeRegex(req.body.username.toLowerCase()), '$'].join(''), 'i')
    }, {
      'username' : new RegExp(['^', escapeRegex(req.body.username.toLowerCase()), '$'].join(''), 'i')
    }).findOne();

    // Check user exists
    if (!User) {
      // Send error
      req.alert('error', 'Username not found');

      // Redirect
      return this.forgotAction(req, res);
    }

    // Check email
    if (!User.get('email')) {
      // Send alert
      return req.alert('error', 'User does not have an email');
    }

    // Set token
    User.set('token', crypto.randomBytes(Math.ceil(24 / 2)).toString('hex').slice(0, 24));

    // Save user
    await User.save();

    // Alert
    req.alert('success', 'An email has been sent with your password reset token');

    // Send email
    email.send(User.get('email') || User.get('username'), 'forgot', {
      'token'   : User.get('token'),
      'subject' : config.get('domain') + ' - forgot password'
    });

    // Return redirect
    return res.redirect('/');
  }

  /**
   * Logout action
   *
   * @param req
   * @param res
   *
   * @acl      true
   * @fail     /
   * @menu     {MAIN} Logout
   * @route    {get} /logout
   * @priority 2
   */
  async logoutAction (req, res) {
    // Hook user login
    await this.eden.emit('user.logout', {
      'req'  : req,
      'user' : req.user
    });

    // Logout
    req.logout();

    // Emit to socket
    socket.session(req.sessionID, 'user', false);

    // Send alert
    await req.alert('success', 'Successfully logged out', {
      'save' : true
    });

    // Redirect to home
    res.redirect('/');
  }

  /**
   * Register action
   *
   * @param req
   * @param res
   *
   * @acl   false
   * @fail  /
   * @title Register
   * @route {get} /register
   */
  registerAction (req, res) {
    // Render registration page
    res.render('register', {
      'redirect' : req.query.redirect || false
    });
  }

  /**
   * Register form action
   *
   * @param req
   * @param res
   *
   * @acl   false
   * @fail  /
   * @title Register
   * @route {post} /register
   */
  async registerSubmitAction (req, res) {
    // Create user
    let User = new user();

    // Check username
    if (req.body.username.trim().length < 5) {
      // Send alert
      req.alert('error', 'your username must be at least 5 characters long');

      // Render registration page
      return res.render('register', {
        'old'      : req.body,
        'redirect' : req.query.redirect || req.body.redirect || false
      });
    }

    // Check email
    if (req.body.email && req.body.email.length) {
      // Check email
      let Email = await user.findOne({
        'email' : new RegExp(['^', escapeRegex(req.body.email), '$'].join(''), 'i')
      });

      // If Email
      if (Email) {
        // Send alert
        req.alert('error', 'the email "' + req.body.email + '" is already taken');

        // Render registration page
        return res.render('register', {
          'old'      : req.body,
          'redirect' : req.query.redirect || req.body.redirect || false
        });
      }

      // Set email
      User.set('email', req.body.email);
    }

    // Check for user
    let Username = await user.findOne({
      'username' : new RegExp(['^', escapeRegex(req.body.username), '$'].join(''), 'i')
    });

    // Check if user exists
    if (Username) {
      // Send alert
      req.alert('error', 'the username "' + req.body.username + '" is already taken');

      // Render registration page
      return res.render('register', {
        'old'      : req.body,
        'redirect' : req.query.redirect || req.body.redirect || false
      });
    }

    // Set email
    User.set('username', req.body.username);

    // Check password length
    if (req.body.password.trim().length < 5) {
      // Send alert
      req.alert('error', 'your password must be at least 5 characters long');

      // Render registration page
      return res.render('register', {
        'old'      : req.body,
        'redirect' : req.query.redirect || req.body.redirect || false
      });
    }

    // Check passwords match
    if (req.body.password !== req.body.passwordb) {
      // Send alert
      req.alert('error', 'your passwords do not match');

      // Render registration page
      return res.render('register', {
        'old'      : req.body,
        'redirect' : req.query.redirect || req.body.redirect || false
      });
    }

    // Everything checks out
    let hash = crypto.createHmac('sha256', config.get('secret'))
      .update(req.body.password)
      .digest('hex');

    // Set hash
    User.set('hash', hash);

    // Let prevented
    let prevented = false;

    // Hook user login
    await this.eden.hook('user.register', {
      'req'  : req,
      'user' : User
    }, async (obj) => {
      // Check error
      if (obj.error) {
        // Set prevented
        prevented = true;

        // Render
        return res.render('register', {
          'old'      : req.body,
          'redirect' : req.query.redirect || req.body.redirect || false
        });
      }

      // Save user
      await User.save();
    });

    // Log user in
    if (!prevented) req.login(User, async () => {
      // Send alert
      await req.alert('success', 'You are now successfully registered', {
        'save' : true
      });

      // Hook user login
      await this.eden.emit('user.login', {
        'req'  : req,
        'user' : User
      });

      // Emit to socket
      socket.session(req.sessionID, 'user', await User.sanitise());

      // Redirect to home
      res.redirect(req.query.redirect || req.body.redirect || '/');
    });
  }

  /**
   * Adds user to locals
   *
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  async _user (req, res, next) {
    // Set user locally
    res.locals.acl  = await aclHelper.list(req.user);
    res.locals.user = req.user ? await req.user.sanitise() : false;

    // Run next
    next();
  }

  /**
   * Checks acl exists
   */
  async _acl () {
    // Create test array
    let Acls = (config.get('acl.default') || []).slice(0);

    // Check if array
    if (!Array.isArray(Acls)) Acls = [Acls];

    // Push admin Acls
    Acls.push(...(config.get('acl.admin') || []).slice(0));

    // Check acls
    for (let i = 0; i < Acls.length; i++) {
      // Load acl
      let check = await acl.count({
        'name' : Acls[i].name
      });

      // Creat if not exists
      if (!check) {
        // Set create
        let create = new acl(Acls[i]);

        // Save
        await create.save();
      }
    }
  }

  /**
   * On user login
   *
   * @param {Object} obj
   */
  async _login (obj) {
    // Add to login
    let Login = new login({
      'ip'      : obj.req ? obj.req.headers['x-forwarded-for'] || obj.req.connection.remoteAddress.replace(/^.*:/, '') : false,
      'way'     : 'login',
      'fail'    : !!obj.fail,
      'user'    : obj.user,
      'message' : obj.message
    });

    // Save login
    await Login.save();
  }

  /**
   * On user login
   *
   * @param {Object} obj
   */
  async _register (obj) {
    // Load user
    let Acls = (config.get('acl.default') || []).slice(0);
    let acls = [];
    let User = obj.user;

    // Set as array
    if (!Array.isArray(Acls)) Acls = [Acls];

    // Check acls
    let count = await user.count();

    // Add admin roles
    if (count === 0) {
      Acls.push(...(config.get('acl.admin') || []).slice(0));
    }

    // Load acls
    for (let i = 0; i < Acls.length; i++) {
      // Load acl
      let check = await acl.findOne({
        'name' : Acls[i].name
      });

      // Check check
      if (check) acls.push(check);
    }

    // Set acls
    User.set('acl', acls);
  }

  /**
   * On user login
   *
   * @param {Object} obj
   */
  async _logout (obj) {
    // Add to login
    let Login = new login({
      'ip'      : obj.req ? obj.req.headers['x-forwarded-for'] || obj.req.connection.remoteAddress : false,
      'way'     : 'logout',
      'fail'    : false,
      'user'    : obj.user,
      'message' : false
    });

    // Save login
    await Login.save();
  }

  /**
   * Authenticate user function
   *
   * @param {String}   username
   * @param {String}   password
   * @param {Function} done
   *
   * @returns {*}
   */
  async _authenticate (username, password, done) {
    // Find user
    let User = await user.match('username', new RegExp(['^', escapeRegex(username), '$'].join(''), 'i')).findOne() ||
               await user.match('email', new RegExp(['^', escapeRegex(username), '$'].join(''), 'i')).findOne();

    // Check user exists
    if (!User) {
      // Return done
      return done(null, false, {
        'user'    : false,
        'message' : 'User not found'
      });
    }

    // Authenticate
    let result = await User.authenticate(password);

    // Check error
    if (result !== true) {
      return done(null, false, {
        'user'    : User,
        'message' : result.info
      });
    }

    // Send done
    done(null, User);
  }

  /**
   * Deserialize user
   *
   * @param {String} id
   * @param {Function} done
   */
  async _deserialise (id, done) {
    // Find user by id
    let User = await user.findById(id);

    // Callback done with user
    done(null, User);
  }
}

/**
 * Eport user controller
 *
 * @type {userController}
 */
exports = module.exports = userController;
