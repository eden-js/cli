/**
 * Created by Awesome on 3/5/2016.
 */

// use strict
'use strict';

// bind methods
var controller = require(global.appRoot + '/bin/bundles/core/controller');

/**
 * build user admin controller
 *
 * @mount /admin/user
 */
class adminController extends controller {
    /**
     * construct user admin controller
     *
     * @param props
     */
    constructor(props) {
        // run super
        super(props);

        // bind methods
        this.indexAction = this.indexAction.bind(this);
    }

    /**
     * index action
     *
     * @param req
     * @param res
     *
     * @route    {get} /
     * @menu     {ADMIN} Users
     * @name     ADMIN.USERS
     * @acl      {test:['admin'],fail:{redirect:"/"}}
     * @priority 11
     */
    indexAction(req, res) {
        res.render('admin/user');
    }
}

/**
 * export admin controller
 *
 * @type {adminController}
 */
module.exports = adminController;