// Require local class dependencies
const Controller = require('controller');

/**
 * Create Admin Controller class. Only visible to people with the 'admin.view' role
 *
 * @acl   admin.view
 * @fail  /
 *
 * @mount /admin
 */
class AdminController extends Controller {

  /**
   * Construct Admin Controller class
   */
  constructor () {
    // Run super
    super();

    // Bind public methods
    this.indexAction = this.indexAction.bind(this);
  }

  /**
   * Admin index action
   *
   * @param    {Request}  req Express request
   * @param    {Response} res Express response
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
    // Render admin page
    res.render('admin');
  }

}

/**
 * Exports Admin Controller class
 *
 * @type {AdminController}
 */
exports = module.exports = AdminController;
