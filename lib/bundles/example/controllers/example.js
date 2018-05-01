
// require local dependencies
// the major requirement of every eden based controller is `controller`.
// controller is an event emitter itself, so all of your controllers can `.on`.
const controller = require ('controller');

/**
 * build example controller
 *
 * eden uses a documentation parsing system to figure out what your controller
 * needs configured. when you make a change to a controller, eden needs you to
 * also run `gulp controllers` or `gulp install`. you can prevent manually
 * having to do this by simply running `gulp` on development instances.
 *
 * eden also allows you to assign priority, mount url, and acl at the controller
 * level with documentation parameters.
 *
 * to assign this controller a mount point, simply:
 *
 * `@mount /example`
 *
 * to assign this controller the required ACL of `example`, simply:
 *
 * `@acl example`
 *
 * to run the next route (eg 404) when this ACL fails, simply:
 *
 * `@fail next`
 *
 * otherwise you can redirect this to a safe place or login url by simply:
 *
 * `@fail /login`
 *
 * to assign this controller a priority (10 by default), simply:
 *
 * `@priority 10`
 */
class example extends controller {

  /**
   * construct example controller class
   *
   * when you construct a controller calss, ensure you run super with all
   * arguments. Though eden does not require arguments on a controller right
   * now, in the future we will allow you to directly pass dependencies to a
   * controller via arguments; so to futureproof your code ensure you pass
   * `...arguments` to super here.
   */
  constructor () {
    // run super
    super (...arguments);
  }

  /**
   * example index action
   *
   * eden also parses routes via the documentation block immediately preceeding
   * each action function. by default an action is not recognised as a route
   * until it has certain attributes.
   *
   * to assign a route to `indexAction` here, simply:
   *
   * `@route {[type]} [url]`
   *
   * for example if we want this function to handle GET on /example we would:
   *
   * `@route {GET} /`
   *
   * these @route directives can be stacked, so this function can act for more
   * than one route by inserting more than one `@route` directive:
   *
   * `@route {GET} /a`
   * `@route {GET} /b`
   *
   * these route directives also consume all appropriate expressJS arguments:
   *
   * `@route {GET} /:id`
   *
   * all route functions can also check ACL the same as the controller itself:
   *
   * `@acl example`
   *
   * fail directives are the same also:
   *
   * `@fail next`
   * `@fail /login`
   *
   * also the same as the main controller, we can pass priority to routes to
   * favor them over other routes:
   *
   * `@priority 10`
   *
   * @param  {Request}   req
   * @param  {Response}  res
   * @param  {Function}  next
   */
  indexAction (req, res, next) {

  }

  /**
   * example socket method
   *
   * socket methods consume all of the above (minus @fail, and @route) and are
   * called with `await socket.call ([method name], [...args])` in the frontend.
   *
   * this makes eden a truely realtime framework, where you can mux and
   * transform both normal and socket actions.
   *
   * to create a socket endpoint, simply:
   *
   * `@call [method name]`
   *
   * for example if we want frontend to be able to
   * `await socket.call ('example')` we would:
   *
   * `@call example`
   *
   * @param  {*}      data
   * @param  {Object} opts
   */
  socketMethod (data, opts) {
    
  }
}

/**
 * export module controller
 *
 * @type {example}
 */
exports = module.exports = example;
