/**
 * Created by Awesome on 3/1/2016.
 */

// use strict
'use strict';

// bind methods
var controller = require ('controller');

/**
 * build admin controller
 *
 * @mount /admin
 * @acl   {test:['admin'],fail:{redirect:"/"}}
 */
class adminController extends controller {
    /**
     * construct admin controller
     *
     * @param  {*} a
     * @param  {*} b
     */
    constructor (a, b) {
        // run super
        super (a, b);

        // bind methods
        this.indexAction = this.indexAction.bind (this);
    }

    /**
     * admin index action
     *
     * @param  {request}  req Express request
     * @param  {response} res Express response
     *
     * @name     ADMIN_HOME
     * @route    {get}   /
     * @menu     {MAIN}  Admin
     * @menu     {ADMIN} Admin Home
     * @priority 10
     */
    indexAction (req, res) {
        // render admin home page
        res.render ('admin', {
            'layout' : 'admin.layout.hbs'
        });
    }
}

/**
 * exports admin controller
 *
 * @type {adminController}
 */
module.exports = adminController;
