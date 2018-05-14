// Require local class dependencies
const Controller = require ('controller');

/**
 * Create Admin Controller class. Only visible to people with the 'Admin.view' role
 *
 * @acl   Admin.view
 * @fail  /
 * @mount /Admin
 */
class AdminController extends Controller {

  /**
   * Construct Admin Controller class
   */
  constructor () {
    // Run super
    super ();

    // Bind public methods
    this.indexAction = this.indexAction.bind (this);
  }

  /**
   * Admin index action
   *
   * @param    {Request}  req Express request
   * @param    {Response} res Express response
   *
   *
   * @menu     {MAIN}  Admin
   * @menu     {ADMIN} Admin Home
   * @icon     fa fa-lock
   * @view     Admin
   * @route    {get}   /
   * @layout   Admin
   * @priority 15
   */
  indexAction (req, res) {
    // Render Admin page
    res.render ();
  }

}

/**
 * Exports Admin Controller class
 *
 * @type {AdminController}
 */
exports = module.exports = AdminController;
