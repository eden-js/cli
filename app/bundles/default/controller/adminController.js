/**
 * Created by Awesome on 1/31/2016.
 */

'use strict';

var controller = require(global.appRoot + '/bin/bundles/core/controller');

class adminController extends controller {
    constructor(props) {
        super(props);

        this.indexAction = this.indexAction.bind(this);
    }

    /**
     * index action
     * @param req
     * @param res
     *
     * @route {get} /asdf
     */
    indexAction(req, res) {
        res.send('hello world again');
    }
}

module.exports = adminController;