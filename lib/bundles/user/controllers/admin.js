
// bind dependencies
const grid       = require ('grid');
const alert      = require ('alert');
const crypto     = require ('crypto');
const controller = require ('controller');

// require models
const acl  = model ('acl');
const user = model ('user');

// bind local dependencies
const config = require ('config');

/**
 * build user admin controller
 *
 * @acl   admin.users.view
 * @fail  /
 * @mount /admin/user
 */
class admin extends controller {
  /**
   * construct user admin controller
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.gridAction         = this.gridAction.bind (this);
    this.indexAction        = this.indexAction.bind (this);
    this.createAction       = this.createAction.bind (this);
    this.updateAction       = this.updateAction.bind (this);
    this.removeAction       = this.removeAction.bind (this);
    this.createSubmitAction = this.createSubmitAction.bind (this);
    this.updateSubmitAction = this.updateSubmitAction.bind (this);
    this.removeSubmitAction = this.removeSubmitAction.bind (this);

    // bind private methods
    this._grid = this._grid.bind (this);
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @icon    fa fa-user
   * @menu    {ADMIN} Users
   * @title   User Administration
   * @route   {get} /
   * @layout  admin
   */
  async indexAction (req, res) {
    // render user admin page
    let Grid = await this._grid ().render ();

    // render grid
    res.render ('user/admin', {
      'grid' : Grid
    });
  }

  /**
   * add/edit action
   *
   * @param req
   * @param res
   *
   * @route    {get} /create
   * @route    {get} /:id/edit
   * @menu     {USERS} Add User
   * @layout   admin
   * @priority 12
   */
  createAction (req, res) {
    // return update action
    return this.updateAction (req, res);
  }

  /**
   * update action
   *
   * @param req
   * @param res
   *
   * @route   {get} /:id/update
   * @layout  admin
   */
  async updateAction (req, res) {
    // set website variable
    let User   = new user ();
    let create = true;

    // check for website model
    if (req.params.id) {
      // load user
      User   = await user.findById (req.params.id);
      create = false;
    }

    // check for website
    if (!User) {
      User = new user ();
    }

    // get acls
    let uacls = (await User.model ('acl') || []).map ((Acl) => {
      // return id
      return Acl.get ('_id').toString ();
    });

    // set acls
    let acls = (await acl.find () || []).map ((Acl) => {
      // return sanitised
      return {
        'id'   : Acl.get ('_id').toString (),
        'has'  : uacls.indexOf (Acl.get ('_id').toString ()) > -1,
        'name' : Acl.get ('name')
      };
    });

    // render page
    res.render ('user/admin/update', {
      'usr' : {
        'id'       : User.get ('_id') ? User.get ('_id').toString () : false,
        'email'    : User.get ('email')    || '',
        'username' : User.get ('username') || ''
      },
      'acls'  : acls,
      'title' : create ? 'Create New' : 'Update ' + (User.get ('username') || User.get ('email'))
    });
  }

  /**
   * create submit action
   *
   * @param req
   * @param res
   *
   * @route   {post} /create
   * @layout  admin
   */
  createSubmitAction (req, res) {
    // return update action
    return this.updateSubmitAction (req, res);
  }

  /**
   * add/edit action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/update
   * @layout  admin
   */
  async updateSubmitAction (req, res) {
    // set website variable
    let User   = new user ();
    let create = true;

    // check for website model
    if (req.params.id) {
      // load by id
      User   = await user.findById (req.params.id);
      create = false;
    }

    // get user acls
    let UAcls = await User.get ('acl');

    // loop acls
    if (req.body.roles && req.body.roles.length) {
      // check if Array
      if (!Array.isArray (req.body.roles)) req.body.roles = [req.body.roles];

      // loop roles
      UAcls = await Promise.all (req.body.roles.map ((role) => {
        // return found role
        return acl.findById (role);
      }));
    }

    // set User model variables
    User.set ('acl',      UAcls);
    User.set ('email',    req.body.email);
    User.set ('username', req.body.username);

    // check for user password
    if (req.body.password && req.body.password.length) {
      // everything checks out
      let hash = crypto.createHmac ('sha256', config.get ('secret'))
          .update (req.body.password)
          .digest ('hex');

      // set hash
      User.set ('hash', hash);
    }

    // save user
    await User.save ();

    // get acls
    let uacls = (await User.model ('acl')).map ((Acl) => {
      // return id
      return Acl.get ('_id').toString ();
    });

    // set acls
    let acls = (await acl.find ()).map ((Acl) => {
      // return sanitised
      return {
        'id'   : Acl.get ('_id').toString (),
        'has'  : uacls.indexOf (Acl.get ('_id').toString ()) > -1,
        'name' : Acl.get ('name')
      };
    });

    // render page
    res.render ('user/admin/update', {
      'usr' : {
        'id'       : User.get ('_id') ? User.get ('_id').toString () : false,
        'email'    : User.get ('email')    || '',
        'username' : User.get ('username') || ''
      },
      'acls'  : acls,
      'title' : create ? 'Create New' : 'Update ' + (User.get ('username') || User.get ('email'))
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {get} /:id/remove
   * @layout  admin
   */
  async removeAction (req, res) {
    // set website variable
    let User = false;

    // check for website model
    if (req.params.id) {
      // load user
      User = await user.findById (req.params.id);
    }

    // render page
    res.render ('user/admin/remove', {
      'usr'   : await User.sanitise (),
      'title' : 'Remove ' + (User.get ('username') || User.get ('email'))
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/remove
   * @title   User Administration
   * @layout  admin
   */
  async removeSubmitAction (req, res) {
    // set website variable
    let User = false;

    // check for website model
    if (req.params.id) {
      // load user
      User = await user.findById (req.params.id);
    }

    // delete website
    await User.remove ();

    // alert Removed
    req.alert ('success', 'Successfully removed ' + (User.get ('username') || User.get ('email')));

    // render index
    return this.indexAction (req, res);
  }

  /**
   * user alert emit
   *
   * @socket user.alert
   */
  async eventSocket (Socket, data) {
    // alert user
    alert.user (await user.findById (data.id), data.type, data.text);

    // alert socket
    alert.socket (Socket, 'success', 'successfully sent alert');
  }

  /**
   * user grid action
   *
   * @param req
   * @param res
   *
   * @route {post} /grid
   */
  gridAction (req, res) {
    // return post grid request
    return this._grid ().post (req, res);
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid () {
    // create new grid
    let userGrid = new grid ();

    // set route
    userGrid.route ('/admin/user/grid');

    // set grid model
    userGrid.model (user);

    // add grid columns
    userGrid.column ('_id', {
      'title'  : 'ID',
      'format' : async (col) => {
        return col ? col.toString ().substring (0, 5) + '..' : '<i>N/A</i>';
      }
    }).column ('username', {
      'sort'   : true,
      'title'  : 'Username',
      'format' : async (col) => {
        return col ? col.toString () : '<i>N/A</i>';
      }
    }).column ('acl', {
      'title'  : 'Roles',
      'format' : async (col, row) => {
        // set acls
        let Acls = await row.model ('acl');
        let acls = [];

        // check acls
        if (!Acls) return '<i>N/A</i>';

        // loop acls
        for (var i = 0; i < Acls.length; i++) {
          // add name to acls
          if (Acls[i].get) acls.push (Acls[i].get ('name'));
        }

        // resolve acls
        return acls.join (', ');
      }
    }).column ('email', {
      'sort'   : true,
      'title'  : 'Email',
      'format' : async (col) => {
        return col ? col.toString () : '<i>N/A</i>';
      }
    }).column ('updated_at', {
      'sort'   : true,
      'title'  : 'Last Online',
      'format' : async (col) => {
        return col.toLocaleDateString ('en-GB', {
          'day'   : 'numeric',
          'month' : 'short',
          'year'  : 'numeric'
        });
      }
    }).column ('created_at', {
      'sort'   : true,
      'title'  : 'Registered',
      'format' : async (col) => {
        return col.toLocaleDateString ('en-GB', {
          'day'   : 'numeric',
          'month' : 'short',
          'year'  : 'numeric'
        });
      }
    }).column ('actions', {
      'type'   : 'html',
      'title'  : 'Actions',
      'format' : async (col, row) => {
        return [
          '<div class="btn-group btn-group-sm" role="group">',
          '<a href="/admin/user/' + row.get ('_id').toString () + '/update" class="btn btn-primary">Update</a>',
          '<a href="/admin/user/' + row.get ('_id').toString () + '/remove" class="btn btn-danger">Remove</a>',
          '</div>'
        ].join ('');
      }
    });

    // add grid filters
    userGrid.filter ('username', {
      'title' : 'Username',
      'type'  : 'text',
      'query' : async (param) => {
        // another where
        userGrid.where ({
          'username' : new RegExp (param.toString ().toLowerCase (), 'i')
        });
      }
    }).filter ('email', {
      'title' : 'Email',
      'type'  : 'text',
      'query' : async (param) => {
        // another where
        userGrid.where ({
          'email' : new RegExp (param.toString ().toLowerCase (), 'i')
        });
      }
    });

    // set default sort order
    userGrid.sort ('created_at', 1);

    // return grid
    return userGrid;
  }
}

/**
 * export admin controller
 *
 * @type {admin}
 */
exports = module.exports = admin;
