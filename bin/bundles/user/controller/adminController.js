/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// bind methods
var user       = require ('user');
var datagrid   = require ('datagrid');
var controller = require ('controller');

/**
 * build user admin controller
 *
 * @mount /admin/user
 * @acl   {test:['admin'],fail:{redirect:"/"}}
 */
class adminController extends controller {
    /**
     * construct user admin controller
     *
     * @param props
     */
    constructor (props) {
        // run super
        super (props);

        // bind methods
        this.indexAction    = this.indexAction.bind (this);
        this.userGridAction = this.userGridAction.bind (this);
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
        res.render ('admin/user');
    }

    /**
     * user grid action
     *
     * @param req
     * @param res
     *
     * @route {post} /grid
     */
    userGridAction (req, res) {
        // return datagrid
        return datagrid.grid (req, user, (row) => {
            return {
                'id'       : row.get ('_id').toString (),
                'username' : row.get ('username')
            };
        }, 'username').then (response => {
            res.json (response);
        });
    }
}

/**
 * export admin controller
 *
 * @type {adminController}
 */
module.exports = adminController;
