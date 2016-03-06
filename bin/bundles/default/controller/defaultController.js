/**
 * Created by Awesome on 2/17/2016.
 */

// use strict
'use strict';

// require local dependencies
var controller = require(global.appRoot + '/bin/bundles/core/controller');

/**
 * build default controller
 */
class defaultController extends controller {
    /**
     * construct default controller
     *
     * @param props
     */
    constructor(props) {
        super(props);

        // bind methods
        this.defaultAction = this.defaultAction.bind(this);
    }

    /**
     * index action
     *
     * @param req
     * @param res
     *
     * @name     HOME
     * @route    {get} /
     * @menu     {MAIN} Home
     * @priority 1
     */
    defaultAction(req, res) {
        res.render('home', {
            'route' : '/'
        });
    }
}

/**
 * export default controller
 *
 * @type {defaultController}
 */
module.exports = defaultController;