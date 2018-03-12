
// require dependencies
const crypto     = require ('crypto');
const controller = require ('controller');

/**
 * build menu controller
 */
class cacheController extends controller {

  /**
   * construct home controller
   */
  constructor () {
    // run super
    super ();

    // bind methods
    this.build = this.build.bind (this);

    // build eden
    this.build ();
  }

  /**
   * build app
   *
   * @param {express} app
   */
  build () {
    // on view compile
    this.eden.pre ('view.compile', (render) => {
      // move menus
      if (render.state.cache) render.cache = render.state.cache;

      // delete from state
      delete render.state.cache;
    });

    // on view json render
    this.eden.pre ('view.json', async (render) => {
      // check cache
      if (render.cache && (render.cache.type === 'all' || (render.cache.type === 'anonymous' && !render.user))) {
        // check all cache
        if (render.cache.type === 'all') {
          // get renderUser
          let renderUser = render.user;

          // delete from render
          delete render.user;

          // set cache
          await this.eden.set (render.cache.name + render.cache.strung + 'json', JSON.stringify (render));

          // add user back
          render.user = renderUser;
        } else {
          // set cache
          await this.eden.set (render.cache.name + render.cache.strung + 'json', JSON.stringify (render));
        }
      }
    });

    // create compile string
    this.eden.pre ('view.render', ({ req, render }) => {
      // check cache
      if (render.cache && render.cache.type === 'all') {
        // remove user from all cache
        delete render.user;
      }
    });

    // create compile string
    this.eden.post ('view.render', async ({ req, render }) => {
      // check cache
      if (render.cache && render.cache.type === 'all') {
        // remove user from all cache
        render.user = req.user ? await req.user.sanitise () : null;
      }
    });

    // on view rendered
    this.eden.pre ('view.rendered', async ({ render, page }) => {
      // check cache
      if (render.cache && (render.cache.type === 'all' || (render.cache.type === 'anonymous' && !render.user))) {
        // set cache
        await this.eden.set (render.cache.name + render.cache.strung, page.split ('<!-- USER.START -->')[0] + '<!-- USER.START --><!-- USER.END -->' + page.split ('<!-- USER.END -->')[1], render.cache.ttl);
      }
    });

    // pre route
    this.eden.pre ('route.args', async ({ args, path, route }) => {
      // check route
      if (route.cache) {
        // push to args
        args.push ((req, res, next) => {
          // set route
          return this._middleware (path, route, req, res, next);
        });
      }
    });
  }

  /**
   * use middleware
   *
   * @param  {String}    path
   * @param  {Object}    route
   * @param  {Request}   req
   * @param  {Response}  res
   * @param  {Function}  next
   *
   * @return {Promise}
   */
  async _middleware (path, route, req, res, next) {
    // get cache
    let {
      type,
      name
    } = route.cache;

    // set to locals
    res.locals.cache = route.cache;

    // stringify body + query
    route.cache.strung = crypto.createHash ('md5').update (JSON.stringify (req.body) + JSON.stringify (req.query) + JSON.stringify (req.param)).digest ('hex');

    // check type is all
    if (type === 'all' || (type === 'anonymous' && !req.user)) {
      // await cache
      let cached = await this.eden.get (name + route.cache.strung + (req.isJSON ? 'json' : ''));

      // check cached
      if (!cached) {
        // log cache miss
        this.logger.log ('debug', path + ' cache miss in ' + (new Date ().getTime () - res.locals.timer.start) + 'ms', {
          'class' : (route && route.type) ? route.type.toUpperCase () + ' ' + route.class + '.' + route.fn : 'no route'
        });

        // return next
        return next ();
      }

      // log cache hit
      this.logger.log ('debug', path + ' cache hit in ' + (new Date ().getTime () - res.locals.timer.start) + 'ms', {
        'class' : (route && route.type) ? route.type.toUpperCase () + ' ' + route.class + '.' + route.fn : 'no route'
      });


      // change cached
      if (req.isJSON) {
        // get cached
        cached = JSON.parse (cached);

        // set cached
        cached.user = req.user ? await req.user.sanitise () : {};

        // stringify cached
        cached = JSON.stringify (cached);
      } else {
        cached = cached.replace ('<!-- USER.START --><!-- USER.END -->', '<!-- USER.START --><script data-eden="before-script">window.eden.user = JSON.parse (decodeURIComponent (atob ("' + new Buffer (encodeURIComponent (JSON.stringify (req.user ? await req.user.sanitise () : {}))).toString ('base64') + '")));</script><!-- USER.END -->');
      }

      // send cached
      res.send (cached);

      // end
      return res.end ();
    }

    // run next
    next ();
  }
}

/**
 * export cache controller
 *
 * @type {cacheController}
 */
exports = module.exports = cacheController;
