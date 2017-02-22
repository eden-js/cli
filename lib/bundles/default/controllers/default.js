/**
 * Created by Awesome on 2/17/2016.
 */

// use strict
'use strict';

// require local dependencies
const controller = require ('controller');

/**
 * build home controller
 */
class home extends controller {
  /**
   * construct home controller
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.homeAction = this.homeAction.bind (this);
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
  homeAction (req, res) {
    // render home page
    res.render ('home');
  }
}

/**
 * export home controller
 *
 * @type {home}
 */
exports = module.exports = home;
