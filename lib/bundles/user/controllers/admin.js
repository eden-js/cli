/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// bind dependencies
const grid       = require ('grid');
const alert      = require ('alert');
const crypto     = require ('crypto');
const controller = require ('controller');

// require models
const acl  = model ('acl');
const user = model ('user');

// bind local dependencies
const config = require ('app/config');

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

    // set acls
    let Acls = await acl.all ();
    let acls = [];

    // get acls
    let UAcls = await User.model ('acl');
        UAcls = UAcls || [];
    let uacls = [];

    // loop user acls
    for (var a = 0; a < UAcls.length; a++) {
      // add to UAcls
      uacls.push (UAcls[a].get ('_id').toString ());
    }

    // loop acls
    for (var i = 0; i < Acls.length; i++) {
      // set acls array
      acls.push ({
        'id'   : Acls[i].get ('_id').toString (),
        'has'  : uacls.indexOf (Acls[i].get ('_id').toString ()) > -1,
        'name' : Acls[i].get ('name')
      });
    }

    // render page
    res.render ('user/admin/update', {
      'usr'   : {
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
    let UAcls = [];

    // loop acls
    if (req.body.roles) {
      for (var e = 0; e < req.body.roles.length; e++) {
        let Acl = await acl.where ({
          '_id' : req.body.roles[e]
        }).findOne ();

        if (Acl) {
          UAcls.push (Acl);
        }
      }
    }

    // check for website
    if (!User) {
      add  = true;
      User = new user ();
    }

    // set User model variables
    User.set ('acl',      UAcls);
    User.set ('email',    req.body.email);
    User.set ('username', req.body.username);

    // check for user password
    if (req.body.password && req.body.password.length) {
      // everything checks out
      let hash = crypto.createHmac ('sha256', config.secret)
          .update (req.body.password)
          .digest ('hex');

      // set hash
      User.set ('hash', hash);
    }

    // save user
    await User.save ();

    // set acls
    let Acls = await acl.all ();
    let acls = [];

    // get acls
    var uacls = [];

    // loop user acls
    for (var a = 0; a < UAcls.length; a++) {
      // add to UAcls
      uacls.push (UAcls[a].get ('_id').toString ());
    }

    // loop acls
    for (var i = 0; i < Acls.length; i++) {
      // set acls array
      acls.push ({
        'id'   : Acls[i].get ('_id').toString (),
        'has'  : uacls.indexOf (Acls[i].get ('_id').toString ()) > -1,
        'name' : Acls[i].get ('name')
      });
    }

    // render page
    res.render ('users/admin/update', {
      'usr'   : {
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
  async eventSocket (Socket, data, User) {
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
      'format' : async (col, row) => {
        return col ? col.toString ().substring (0, 5) + '..' : '<i>N/A</i>';
      }
    }).column ('username', {
      'title'  : 'Username',
      'format' : async (col, row) => {
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
      'title'  : 'Email',
      'format' : async (col, row) => {
        return col ? col.toString () : '<i>N/A</i>';
      }
    }).column ('updated_at', {
      'title'  : 'Last Online',
      'format' : async (col, row) => {
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
            '<a href="/admin/user/' + row.get ('_id').toString () + '/update" class="btn btn-primary">Edit</a>',
            '<a href="/admin/user/' + row.get ('_id').toString () + '/remove" class="btn btn-danger">Delete</a>',
          '</div>'
        ].join ('');
      }
    });

    // add grid filters
    userGrid.filter ('username', {
      'title' : 'Username',
      'type'  : 'text',
      'query' : (query, param) => {
        // another where
        query.and ({
          'username' : {
            '$regex' : param.toString ()
          }
        });
      }
    }).filter ('email', {
      'title' : 'Email',
      'type'  : 'text',
      'query' : (query, param) => {
        // another where
        query.and ({
          'email' : {
            '$regex' : param.toString ().toLowerCase ()
          }
        });
      }
    });

    // return grid
    return userGrid;
  }
}

/**
 * export admin controller
 *
 * @type {admin}
 */
module.exports = admin;
