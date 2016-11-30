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
 * @acl   admin.dashboard.view
 * @mount /admin
 * @fail  /
 */
class admin extends controller {
    /**
     * construct admin controller
     *
     * @param  {eden} eden
     */
    constructor (eden) {
        // run super
        super (eden);

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
     * @priority 0
     */
    indexAction (req, res) {
        // render admin home page
        res.render ('admin', {
            'layout' : 'admin'
        });
    }
}

/**
 * exports admin controller
 *
 * @type {admin}
 */
module.exports = admin;
