// Require local class dependencies
//
// The major requirement of every eden based controller is `controller`. Controller is an event emitter itself, so all
// of your controllers can `.on`.
const Controller = require('controller');

/**
 * Create Example Controller class
 *
 * Eden uses a documentation parsing system to figure out what your controller needs configured. When you make a change
 * to a controller, Eden needs you to also run `gulp controllers` or `gulp install`. You can prevent manually having to
 * do this by simply running `gulp` on development instances.
 *
 * Eden also allows you to assign priority, mount url, and acl at the controller level with documentation parameters.
 *
 * To assign this controller a mount point, simply:
 *
 * `@mount /example`
 *
 * To assign this controller the required ACL of `example`, simply:
 *
 * `@acl example`
 *
 * To run the next route (eg 404) when this ACL fails, simply:
 *
 * `@fail next`
 *
 * Otherwise you can redirect this to a safe place or login url by simply:
 *
 * `@fail /login`
 *
 * To assign this controller a priority (10 by default), simply:
 *
 * `@priority 10`
 */
class ExampleController extends Controller {

  /**
   * Construct Example Controller class
   */
  constructor () {
    // Run super
    super();
  }

  /**
   * Example index action
   *
   * Eden also parses routes via the documentation block immediately preceding each action function. By default an
   * action is not recognised as a route until it has certain attributes.
   *
   * To assign a route to `indexAction` here, simply:
   *
   * `@route {[type]} [url]`
   *
   * For example if we want this function to handle GET on /example we would:
   *
   * `@route {GET} /`
   *
   * These @route directives can be stacked, so this function can act for more than one route by inserting more than one
   * `@route` directive:
   *
   * `@route {GET} /a`
   * `@route {GET} /b`
   *
   * These route directives also consume all appropriate expressJS arguments:
   *
   * `@route {GET} /:id`
   *
   * All route functions can also check ACL the same as the controller itself:
   *
   * `@acl example`
   *
   * Fail directives are the same also:
   *
   * `@fail next`
   * `@fail /login`
   *
   * Also the same as the main controller, we can pass priority to routes to favor them over other routes:
   *
   * `@priority 10`
   *
   * @param  {Request}   req
   * @param  {Response}  res
   * @param  {function}  next
   */
  indexAction (req, res, next) {

  }

  /**
   * Example socket method
   *
   * Socket methods consume all of the above (minus @fail, and @route) and are called with
   * `await socket.call ([method name], [...args])` in the frontend.
   *
   * This makes eden a truly realtime framework, where you can mux and transform both normal and socket actions.
   *
   * To create a socket endpoint, simply:
   *
   * `@call [method name]`
   *
   * For example if we want frontend to be able to `await socket.call ('example')` we would:
   *
   * `@call example`
   *
   * @param {*}      data
   * @param {object} opts
   */
  socketMethod (data, opts) {

  }

}

/**
 * Export Example Controller class
 *
 * @type {ExampleController}
 */
exports = module.exports = ExampleController;
