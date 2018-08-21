// Require dependencies
const crypto = require('crypto');

// Require local class dependencies
const Controller = require('controller');

/**
 * Create Cache Controller class
 */
class CacheController extends Controller {

  /**
   * Construct Cache Controller class
   */
  constructor () {
    // Run super
    super();

    // Bind public methods
    this.build = this.build.bind(this);

    // Run build
    this.build();
  }

  /**
   * Build Cache Controller
   */
  build () {
    // On view pre-compile
    this.eden.pre('view.compile', (render) => {
      // Check cache in state
      if (render.state.cache) render.cache = render.state.cache;

      // Delete cache from state
      delete render.state.cache;
    });

    // On view pre-json
    this.eden.pre('view.json', async (render) => {
      // Check cache
      if (render.cache && (render.cache.type === 'all' || (render.cache.type === 'anonymous' && !render.user))) {
        // Check all cache
        if (render.cache.type === 'all') {
          // Get renderUser
          const renderUser = render.user;

          // Delete from render
          delete render.user;

          // Set cache
          await this.eden.set(render.cache.name + render.cache.strung + 'json', JSON.stringify(render));

          // Add user back
          render.user = renderUser;
        } else {
          // Set cache
          await this.eden.set(render.cache.name + render.cache.strung + 'json', JSON.stringify(render));
        }
      }
    });

    // On view pre-render
    this.eden.pre('view.render', ({ req, render }) => {
      // Check cache
      if (render.cache && render.cache.type === 'all') {
        // Remove user from all cache
        delete render.user;
      }
    });

    // On view post-render
    this.eden.post('view.render', async ({ req, render }) => {
      // Check cache
      if (render.cache && render.cache.type === 'all') {
        // Remove user from all cache
        render.user = req.user ? await req.user.sanitise() : null;
      }
    });

    // On view pre-rendered
    this.eden.pre('view.rendered', async ({ render, page }) => {
      // Check cache
      if (render.cache && (render.cache.type === 'all' || (render.cache.type === 'anonymous' && !render.user))) {
        // Set cache
        await this.eden.set(render.cache.name + render.cache.strung, page.split('<!-- USER.START -->')[0] + '<!-- USER.START --><!-- USER.END -->' + page.split('<!-- USER.END -->')[1], render.cache.ttl);
      }
    });

    // On route pre-args
    this.eden.pre('route.args', async ({ args, path, route }) => {
      // Check route
      if (route.cache) {
        // Push to args
        args.push((req, res, next) => {
          // Set route
          return this._middleware(path, route, req, res, next);
        });
      }
    });
  }

  /**
   * Use middleware
   *
   * @param  {string}   path
   * @param  {object}   route
   * @param  {Request}  req
   * @param  {Response} res
   * @param  {function} next
   *
   * @return {Promise}
   *
   * @async
   */
  async _middleware (path, route, req, res, next) {
    // Get cache
    const {
      type,
      name
    } = route.cache;

    // Set to locals
    res.locals.cache = route.cache;

    // Stringify body + query
    route.cache.strung = crypto.createHash('md5').update(JSON.stringify(req.body) + JSON.stringify(req.query) + JSON.stringify(req.params)).digest('hex');

    // Check type is all
    if (type === 'all' || (type === 'anonymous' && !req.user)) {
      // Await cache
      let cached = await this.eden.get(name + route.cache.strung + (req.isJSON ? 'json' : ''));

      // Check cached
      if (!cached) {
        // Log cache miss
        this.logger.log('debug', path + ' cache miss in ' + (new Date().getTime() - res.locals.timer.start) + 'ms', {
          'class' : (route && route.type) ? route.type.toUpperCase() + ' ' + route.class + '.' + route.fn : 'No Route'
        });

        // Return next
        return next();
      }

      // Log cache hit
      this.logger.log('debug', path + ' cache hit in ' + (new Date().getTime() - res.locals.timer.start) + 'ms', {
        'class' : (route && route.type) ? route.type.toUpperCase() + ' ' + route.class + '.' + route.fn : 'No Route'
      });


      // Change cached
      if (req.isJSON) {
        // Get cached
        cached = JSON.parse(cached);

        // Set cached
        cached.user = req.user ? await req.user.sanitise() : {};

        // Stringify cached
        cached = JSON.stringify(cached);
      } else {
        cached = cached.replace('<!-- USER.START --><!-- USER.END -->', '<!-- USER.START --><script data-eden="before-script">window.eden.user = JSON.parse (decodeURIComponent (atob ("' + new Buffer(encodeURIComponent(JSON.stringify(req.user ? await req.user.sanitise() : {}))).toString('base64') + '")));</script><!-- USER.END -->');
      }

      // Send cached
      res.send(cached);

      // End
      return res.end();
    }

    // Run next
    next();
  }

}

/**
 * Export Cache Controller class
 *
 * @type {CacheController}
 */
exports = module.exports = CacheController;
