// Require local class dependencies
import config     from 'config';
import socket     from 'socket';
import Controller from 'controller';

/**
 * Create Core Controller class
 */
export default class DevController extends Controller {
  /**
   * Construct Home Controller class
   */
  constructor() {
    // Run super
    super();

    // Bind public methods
    this.indexAction = this.eventAction.bind(this);
  }

  /**
   * Index action
   *
   * @param {Request}  req
   * @param {Response} res
   *
   * @route {post} /dev/event
   */
  eventAction(req, res, next) {
    // check auth
    if (req.headers['authentication'] !== `AUTH:${config.get('secret')}`) return next();
    
    // emit to frontends
    socket.emit(`dev:${req.body.type}`, ...req.body.args);

    // send ok
    res.send('ok');
    res.end();
  }
}