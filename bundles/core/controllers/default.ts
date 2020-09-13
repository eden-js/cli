
// Require local class dependencies
import Controller from 'controller';

/**
 * Create Core Controller class
 */
export default class DefaultController extends Controller {
  /**
   * Construct Home Controller class
   */
  constructor() {
    // Run super
    super();

    // Bind public methods
    this.indexAction = this.indexAction.bind(this);
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
  indexAction(req, res) {
    // Render home page
    res.render('home');
  }
}