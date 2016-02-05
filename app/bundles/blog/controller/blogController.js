/**
 * Created by Awesome on 2/4/2016.
 */

'use strict';

var controller = require(global.appRoot + '/bin/bundles/core/controller');

/**
 * create blog controller class
 */
class blogController extends controller {
    constructor(props) {
        super(props);
    }

    /**
     * index action
     * @param req
     * @param res
     *
     * @route {get} /
     */
    indexAction(req, res) {
        res.render('home', {
            'title' : 'Home'
        });
    }
}

/**
 * blog controller
 * @type {blogController}
 */
module.exports = blogController;