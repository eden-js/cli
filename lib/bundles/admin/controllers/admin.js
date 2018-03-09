
// bind methods
const controller = require ('controller');

/**
 * build admin controller
 * only visible to people with the 'admin.view' role
 *
 * @acl   admin.view
 * @fail  /
 * @mount /admin
 */
class admin extends controller {

  /**
   * construct admin
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.indexAction = this.indexAction.bind (this);
  }

  /**
   * admin index action
   *
   * @param  {request}  req Express request
   * @param  {response} res Express response
   *
   *
   * @menu     {MAIN}  Admin
   * @menu     {ADMIN} Admin Home
   * @icon     fa fa-lock
   * @view     admin
   * @route    {get}   /
   * @layout   admin
   * @priority 15
   */
  indexAction (req, res) {
    // render admin page
    res.render ();
  }
}

/**
 * exports admin controller
 *
 * @type {admin}
 */
exports = module.exports = admin;
