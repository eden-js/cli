
// Bind dependencies
const Grid        = require('grid');
const alert       = require('alert');
const crypto      = require('crypto');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// Require models
const Acl  = model('acl');
const User = model('user');

// Bind local dependencies
const config = require('config');

/**
 * Build user admin controller
 *
 * @acl   admin.users.view
 * @fail  /
 * @mount /admin/user
 */
class AdminUserController extends Controller {

  /**
   * Construct user admin controller
   */
  constructor () {
    // Run super
    super();

    // Bind methods
    this.gridAction         = this.gridAction.bind(this);
    this.indexAction        = this.indexAction.bind(this);
    this.createAction       = this.createAction.bind(this);
    this.updateAction       = this.updateAction.bind(this);
    this.removeAction       = this.removeAction.bind(this);
    this.createSubmitAction = this.createSubmitAction.bind(this);
    this.updateSubmitAction = this.updateSubmitAction.bind(this);
    this.removeSubmitAction = this.removeSubmitAction.bind(this);

    // Bind private methods
    this._grid = this._grid.bind(this);
  }

  /**
   * Index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @icon    fa fa-user
   * @menu    {ADMIN} Users
   * @title   User Administration
   * @route   {get} /
   * @layout  admin
   */
  async indexAction (req, res) {
    // Render user admin page
    let grid = await this._grid().render(req);

    // Render grid
    res.render('user/admin', {
      'grid' : grid
    });
  }

  /**
   * Add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
   * @return *
   *
   * @route    {get} /create
   * @route    {get} /:id/edit
   * @menu     {USERS} Add User
   * @layout   admin
   * @priority 12
   */
  createAction (req, res) {
    // Return update action
    return this.updateAction(req, res);
  }

  /**
   * Update action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/update
   * @layout  admin
   */
  async updateAction (req, res) {
    // Set website variable
    let user   = new User();
    let create = true;

    // Check for website model
    if (req.params.id) {
      // Load user
      user   = await User.findById(req.params.id);
      create = false;
    }

    // Get acls
    let uacls = (await user.get('acl') || []).map((acl) => {
      // Return id
      return acl.get('_id').toString();
    });

    // Set acls
    let acls = (await Acl.find() || []).map((acl) => {
      // Return sanitised
      return {
        'id'   : acl.get('_id').toString(),
        'has'  : uacls.includes(acl.get('_id').toString()),
        'name' : acl.get('name')
      };
    });

    // Render page
    res.render('user/admin/update', {
      'usr'   : await user.sanitise(),
      'acls'  : acls,
      'title' : create ? 'Create New' : 'Update ' + (user.get('username') || user.get('email'))
    });
  }

  /**
   * Login as user
   *
   * @param  {Request}  req
   * @param  {Response} res
   *
   * @route   {get} /:id/login
   * @return {Promise}
   */
  async loginAsAction (req, res) {
    // Set website variable
    let user = await User.findById(req.params.id);

    // Login as user
    req.login(user, () => {
      // Redirect
      res.redirect('/');
    });
  }

  /**
   * Create submit action
   *
   * @param  {Response} req
   * @param  {Request}  res
   * @return *
   *
   * @route   {post} /create
   * @layout  admin
   */
  createSubmitAction (req, res) {
    // Return update action
    return this.updateSubmitAction(req, res);
  }

  /**
   * Add/edit action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /:id/update
   * @layout  admin
   */
  async updateSubmitAction (req, res) {
    // Set website variable
    let user   = new User();
    let create = true;

    // Check for website model
    if (req.params.id) {
      // Load by id
      user   = await User.findById(req.params.id);
      create = false;
    }

    // Get user acls
    let UAcls = await user.get('acl');

    // Loop acls
    if (req.body.roles && req.body.roles.length) {
      // Check if Array
      if (!Array.isArray(req.body.roles)) req.body.roles = [req.body.roles];

      // Loop roles
      UAcls = await Promise.all(req.body.roles.map((role) => {
        // Return found role
        return Acl.findById(role);
      }));
    }

    // Set User model variables
    user.set('acl',      UAcls);
    user.set('email',    req.body.email);
    user.set('username', req.body.username);

    // Check for user password
    if (req.body.password && req.body.password.length) {
      // Everything checks out
      let hash = crypto.createHmac('sha256', config.get('secret'))
        .update(req.body.password)
        .digest('hex');

      // Set hash
      user.set('hash', hash);
    }

    // Save user
    await user.save();

    // Get acls
    let uacls = (await user.get('acl')).map((acl) => {
      // Return id
      return acl.get('_id').toString();
    });

    // Set acls
    let acls = (await Acl.find()).map((acl) => {
      // Return sanitised
      return {
        'id'   : acl.get('_id').toString(),
        'has'  : uacls.includes(acl.get('_id').toString()),
        'name' : acl.get('name')
      };
    });

    // Update user
    req.alert('success', 'Successfully updated user');

    // Render page
    res.render('user/admin/update', {
      'usr'   : await user.sanitise(),
      'acls'  : acls,
      'title' : create ? 'Create New' : 'Update ' + (user.get('username') || user.get('email'))
    });
  }

  /**
   * Delete action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {get} /:id/remove
   * @layout  admin
   */
  async removeAction (req, res) {
    // Set website variable
    let user = false;

    // Check for website model
    if (req.params.id) {
      // Load user
      user = await User.findById(req.params.id);
    }

    // Render page
    res.render('user/admin/remove', {
      'usr'   : await user.sanitise(),
      'title' : 'Remove ' + (user.get('username') || user.get('email'))
    });
  }

  /**
   * Delete action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route   {post} /:id/remove
   * @title   User Administration
   * @layout  admin
   */
  async removeSubmitAction (req, res) {
    // Set website variable
    let user = false;

    // Check for website model
    if (req.params.id) {
      // Load user
      user = await User.findById(req.params.id);
    }

    // Alert Removed
    req.alert('success', 'Successfully removed ' + (user.get('username') || user.get('email')));

    // Delete website
    await user.remove();

    // Render index
    return this.indexAction(req, res);
  }

  /**
   * User alert emit
   *
   * @param {Object} data
   * @param {Object} opts
   *
   * @socket user.alert
   */
  async alertSocket (data, opts) {
    // Alert user
    alert.user(await User.findById(data.id), data.type, data.text);

    // Alert socket
    opts.alert('success', 'successfully sent alert');
  }

  /**
   * User grid action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {post} /grid
   *
   * @returns {Promise}
   */
  gridAction (req, res) {
    // Return post grid request
    return this._grid().post(req, res);
  }

  /**
   * Renders grid
   *
   * @return {grid}
   */
  _grid () {
    // Create new grid
    let userGrid = new Grid();

    // Set route
    userGrid.route('/admin/user/grid');

    // Set grid model
    userGrid.model(User);

    // Add grid columns
    userGrid.column('_id', {
      'title'  : 'ID',
      'width'  : '1%',
      'format' : (col) => {
        return col ? '<a href="/admin/user/' + col.toString() + '/update">' + col.toString() + '</a>' : '<i>N/A</i>';
      }
    }).column('username', {
      'sort'   : true,
      'title'  : 'Username',
      'format' : (col) => {
        return col ? col.toString() : '<i>N/A</i>';
      },
      'update' : async (row, value) => {
        // Set value
        await row.lock();

        // Set username
        row.set('username', value);

        // Save
        await row.save();

        // Unlock
        row.unlock();
      }
    }).column('email', {
      'sort'   : true,
      'title'  : 'Email',
      'format' : (col) => {
        return col ? col.toString() : '<i>N/A</i>';
      },
      'input'  : 'email',
      'update' : async (row, value) => {
        // Set value
        await row.lock();

        // Set username
        row.set('email', value);

        // Save
        await row.save();

        // Unlock
        row.unlock();
      }
    }).column('acl', {
      'title'  : 'Roles',
      'format' : async (col, row) => {
        // Set acls
        let acls = (await row.get('acl')).filter((acl) => acl && acl.get);

        // Return mapped
        return acls.map((acl) => acl.get('name')).join(', ');
      }
    }).column('updated_at', {
      'sort'   : true,
      'title'  : 'Last Online',
      'format' : (col) => {
        return col ? col.toLocaleDateString('en-GB', {
          'day'   : 'numeric',
          'month' : 'short',
          'year'  : 'numeric'
        }) : '<i>N/A</i>';
      },
      'input'  : 'date',
      'update' : async (row, value) => {
        // Set value
        await row.lock();

        // Set username
        row.set('updated_at', new Date(value));

        // Save
        await row.save();

        // Unlock
        row.unlock();
      }
    }).column('created_at', {
      'sort'   : true,
      'title'  : 'Registered',
      'format' : (col) => {
        return col ? col.toLocaleDateString('en-GB', {
          'day'   : 'numeric',
          'month' : 'short',
          'year'  : 'numeric'
        }) : '<i>N/A</i>';
      },
      'input'  : 'date',
      'update' : async (row, value) => {
        // Set value
        await row.lock();

        // Set username
        row.set('created_at', new Date(value));

        // Save
        await row.save();

        // Unlock
        row.unlock();
      }
    }).column('actions', {
      'type'   : false,
      'width'  : '1%',
      'title'  : 'Actions',
      'format' : (col, row) => {
        return [
          '<div class="btn-group btn-group-sm" role="group">',
            '<a href="/admin/user/' + row.get('_id').toString() + '/update" class="btn btn-primary">',
              '<i class="fa fa-pencil"></i>',
            '</a>',
            '<a href="/admin/user/' + row.get('_id').toString() + '/remove" class="btn btn-danger">',
              '<i class="fa fa-times"></i>',
            '</a>',
          '</div>'
        ].join('');
      }
    });

    // Add grid filters
    userGrid.filter('username', {
      'title' : 'Username',
      'type'  : 'text',
      'query' : (param) => {
        // Another where
        userGrid.match('username', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
      }
    }).filter('email', {
      'title' : 'Email',
      'type'  : 'text',
      'query' : (param) => {
        // Another where
        userGrid.match('email', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i'));
      }
    });

    // Set default sort order
    userGrid.sort('created_at', 1);

    // Return grid
    return userGrid;
  }
}

/**
 * Export admin controller
 *
 * @type {admin}
 */
exports = module.exports = AdminUserController;
