// Require local class dependencies
const Controller = require('controller');

/**
 * Create Home Controller class
 */
class HomeController extends Controller {

  /**
   * Construct Home Controller class
   */
  constructor () {
    // Run super
    super();

    // Bind public methods
    this.homeAction = this.homeAction.bind(this);
  }

  /**
   * Index action
   *
   * @param    {Request}  req
   * @param    {Response} res
   *
   * @name     HOME
   * @route    {get} /
   * @menu     {MAIN} Home
   * @priority 1
   */
  homeAction (req, res) {
    // Render home page
    res.render('home');
  }

}

/**
 * Export Home Controller class
 *
 * @type {HomeController}
 */
exports = module.exports = HomeController;
