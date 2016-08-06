/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// bind methods
var user       = require ('user');
var grid       = require ('grid');
var controller = require ('controller');

/**
 * build user admin controller
 *
 * @mount /admin/user
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
        this.gridAction  = this.gridAction.bind (this);
        this.indexAction = this.indexAction.bind (this);

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
     * @priority 11
     */
    indexAction (req, res) {
        // render user admin page
        this._grid ().render ().then (rendered => {
            // render grid
            res.render ('user-admin', {
                'layout' : 'admin',
                'grid'   : rendered
            });
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
        userGrid.route ('/admin/user/grid');

        // set grid model
        userGrid.model (user);

        // add grid columns
        userGrid.column ('_id', {
            'title'  : 'ID',
            'format' : (col, row) => {
                return Promise.resolve (col.toString ());
            }
        });
        userGrid.column ('username', {
            'title'  : 'Username',
            'format' : (col, row) => {
                return Promise.resolve (col.toString ());
            }
        });
        userGrid.column ('email', {
            'title'  : 'Email',
            'format' : (col, row) => {
                return Promise.resolve (col.toString ());
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
