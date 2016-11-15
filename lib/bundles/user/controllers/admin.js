/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// bind dependencies
var grid       = require ('grid');
var crypto     = require ('crypto');
var controller = require ('controller');

// bind local dependencies
var acl    = require ('user/models/acl');
var user   = require ('user/models/user');
var config = require ('app/config');

/**
 * build user admin controller
 *
 * @mount /admin/users
 * @acl   {test:['admin'],fail:{redirect:"/"}}
 */
class admin extends controller {
    /**
     * construct user admin controller
     *
     * @param {eden} eden
     */
    constructor (eden) {
        // run super
        super (eden);

        // bind methods
        this.gridAction         = this.gridAction.bind (this);
        this.indexAction        = this.indexAction.bind (this);
        this.deleteAction       = this.deleteAction.bind (this);
        this.deleteSubmitAction = this.deleteSubmitAction.bind (this);

        // bind private methods
        this._grid = this._grid.bind (this);
    }

    /**
     * index action
     *
     * @param req
     * @param res
     *
     * @name     ADMIN_USERS
     * @route    {get} /
     * @menu     {ADMIN} Users
     */
    async indexAction (req, res) {
        // render user admin page
        var Grid = await this._grid ().render ();

        // render grid
        res.render ('users-admin', {
            'grid'      : Grid,
            'layout'    : 'admin',
            'pagedesc'  : 'Cameltoe Users Home',
            'pagetitle' : 'Users'
        });
    }

    /**
     * add/edit action
     *
     * @param req
     * @param res
     *
     * @name     ADMIN_USER_ADD
     * @route    {get} /add
     * @route    {get} /:id/edit
     * @menu     {USERS} Add User
     * @priority 12
     */
    async addEditAction (req, res) {
        // set website variable
        var User = false;

        // check for website model
        if (req.params.id) {
            User = await user.where ({
                '_id' : req.params.id
            }).findOne ();
        }

        // check for website
        if (!User) {
            User = new user ();
        }

        // set acls
        var Acls = await acl.all ();
        var acls = [];

        // get acls
        var UAcls = await User.model ('acl');
            UAcls = UAcls || [];
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
        res.render ('users-admin-add', {
            'usr'        : {
                'id'       : User.get ('_id') ? User.get ('_id').toString () : false,
                'email'    : User.get ('email')    || '',
                'username' : User.get ('username') || ''
            },
            'acls'       : acls,
            'crumbs'     : [
                {
                    'title' : 'Users',
                    'route' : '/admin/users'
                }
            ],
            'layout'     : 'admin',
            'pagedesc'   : 'Cameltoe User ' + User.get ('_id') ? 'Edit' : 'Add',
            'pagetitle'  : 'Users ' + User.get ('_id') ? 'Edit' : 'Add'
        });
    }

    /**
     * add/edit action
     *
     * @param req
     * @param res
     *
     * @route  {post} /add
     * @route  {post} /:id/edit
     */
    async addEditSubmitAction (req, res) {
        // set website variable
        var add  = false;
        var User = false;

        // check for website model
        if (req.params.id) {
            User = await user.where ({
                '_id' : req.params.id
            }).findOne ();
        }

        // get user acls
        var UAcls = [];

        // loop acls
        if (req.body.roles) {
            for (var e = 0; e < req.body.roles.length; e++) {
                var Acl = await acl.where ({
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
            var hash = crypto.createHmac ('sha256', config.secret)
                .update (req.body.password)
                .digest ('hex');

            // set hash
            User.set ('hash', hash);
        }

        // save user
        await User.save ();

        // set acls
        var Acls = await acl.all ();
        var acls = [];

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
        res.render ('users-admin-add', {
            'usr'        : {
                'id'       : User.get ('_id') ? User.get ('_id').toString () : false,
                'email'    : User.get ('email')    || '',
                'username' : User.get ('username') || ''
            },
            'acls'       : acls,
            'crumbs'     : [
                {
                    'title' : 'Users',
                    'route' : '/admin/users'
                }
            ],
            'layout'     : 'admin',
            'success'    : add ? 'Successfully added new User' : 'Successfully updated User',
            'pagedesc'   : 'Cameltoe Users',
            'pagetitle'  : 'Users Home'
        });
    }

    /**
     * delete action
     *
     * @param req
     * @param res
     *
     * @route  {get} /:id/delete
     */
    async deleteAction (req, res) {
        // set website variable
        var User = false;

        // check for website model
        if (req.params.id) {
            User = await user.where ({
                '_id' : req.params.id
            }).findOne ();
        }

        // render page
        res.render ('users-admin-delete', {
            'usr'       : await User.sanitise (),
            'crumbs'    : [
                {
                    'title' : 'Users',
                    'route' : '/admin/users'
                }
            ],
            'layout'    : 'admin',
            'pagedesc'  : 'Cameltoe User Delete',
            'pagetitle' : 'Delete User ' + User.get ('name')
        });
    }

    /**
     * delete action
     *
     * @param req
     * @param res
     *
     * @route  {post} /:id/delete
     */
    async deleteSubmitAction (req, res) {
        // set website variable
        var User = false;

        // check for website model
        if (req.params.id) {
            User = await user.where ({
                '_id' : req.params.id
            }).findOne ();
        }

        // delete website
        await User.remove ();

        // render user admin page
        var Grid = await this._grid ().render ();

        // render page
        res.render ('users-admin', {
            'grid'      : Grid,
            'layout'    : 'admin',
            'success'   : 'Successfully deleted User',
            'pagedesc'  : 'Cameltoe Users',
            'pagetitle' : 'Users Home'
        });
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
        var userGrid = new grid ();

        // set route
        userGrid.route ('/admin/users/grid');

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
                var Acls = await row.model ('acl');
                var acls = [];

                // loop acls
                for (var i = 0; i < Acls.length; i++) {
                    // add name to acls
                    acls.push (Acls[i].get ('name'));
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
                    '<div class="btn-group btn-group-sm" role="group" aria-label="Basic example">',
                        '<a href="/admin/users/' + row.get ('_id').toString () + '/edit" class="btn btn-primary">Edit</a>',
                        '<a href="/admin/users/' + row.get ('_id').toString () + '/delete" class="btn btn-danger">Delete</a>',
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
