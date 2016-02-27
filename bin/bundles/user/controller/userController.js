/**
 * Created by Awesome on 2/21/2016.
 */

'use strict';

// require local dependencies
var controller = require('../../core/controller');
var user       = require('../model/user');

// require dependencies
var co = require('co');

/**
 * create user controller
 *
 * @mount /user
 */
class userController extends controller {
    /**
     * constructor for user controller
     * @param props
     */
    constructor(props) {
        super(props);

        // bind methods
        this.loginAction     = this.loginAction.bind(this);
        this.loginFormAction = this.loginFormAction.bind(this);
    }

    /**
     * login action
     * @param req
     * @param res
     *
     * @route {get} /user/login
     * @menu {{"name":"LOGIN","menu":"MAIN","priority":1}} Login
     */
    loginAction(req, res) {
        res.render('login', {
            'title' : 'TibiaHunts',
            'route' : '/user/login'
        });
    }

    /**
     * login Form action
     * @param req
     * @param res
     *
     * @route {post} /user/login
     */
    loginFormAction(req, res) {
        co(function * () {
            let User = yield user.where({
                'username' : req.body.user
            }).findOne();

            if (!User) {
                res.render('login', {
                    'title' : 'TibiaHunts',
                    'route' : '/user/login',
                    'error' : 'User not found',
                    'form' : {
                        'old': req.body
                    }
                });
            }
        });
    }
}

/**
 * user controller
 * @type {userController}
 */
module.exports = userController;