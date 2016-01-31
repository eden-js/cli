/**
 * Created by Awesome on 1/30/2016.
 */

'use strict';

var controller = require(global.appRoot + '/bin/bundles/core/controller');

class defaultController extends controller {
    constructor(props) {
        super(props);

        this.indexAction = this.indexAction.bind(this);
    }

    /**
     * index action
     * @param req
     * @param res
     *
     * @route {get} /
     */
    indexAction(req, res) {
        res.send('hello world');
    }
}

module.exports = defaultController;