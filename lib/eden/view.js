// Require local dependencies
const config = require ('config');
const eden   = require ('eden');

/**
 * Create View class
 */
class View {

  /**
   * Construct View class
   */
  constructor () {
    // Bind public methods
    this.render = this.render.bind (this);
  }

  /**
   * Create email template
   *
   * @param  {String} template
   * @param  {Object} options
   *
   * @return Promise
   */
  async email (template, options) {
    // Set config
    options.config = {
      'cdn'    : config.get ('cdn')  || false,
      'logo'   : config.get ('logo') || false,
      'title'  : config.get ('title'),
      'domain' : config.get ('domain'),
      'socket' : config.get ('socket')
    };

    // Run email compile hook
    await eden.hook ('email.compile', options);

    // Set compiled
    let compiled = false;

    // Create compile string
    await eden.hook ('email.render', {
      'options'  : options,
      'template' : template
    }, async () => {
      // Compile email
      compiled = await eden.email (template, options);
    });

    // Return compiled email
    return compiled;
  }

  /**
   * Render view
   *
   * @param  {String}    path
   * @param  {Object}    options
   * @param  {Function}  callback
   *
   * @return {*}
   */
  async render (path, options, callback) {
    // Load req and res
    const res = options.res;
    const req = res.req;

    // Create remove array
    const remove = [
      'i18n', 'res', 'page', 'route', 'layout', '_locals', 'settings', 'head', 'routeStart', 'url', 'path', 'isJSON', 'timer'
    ];

    // Set route
    const route = options.route || {};

    // Run view route hook
    await eden.hook ('view.route', route);

    // Set render Object
    const render = {
      'page'  : options.page,
      'mount' : {
        'url'    : options.url,
        'path'   : options.path || '404',
        'page'   : path,
        'layout' : (options.layout || route.layout || 'main')
      },
      'config' : {
        'cdn'    : config.get ('cdn')  || false,
        'logo'   : config.get ('logo') || false,
        'title'  : config.get ('title'),
        'domain' : config.get ('domain'),
        'socket' : config.get ('socket')
      },
      'isJSON'  : req.isJSON,
      'session' : req.sessionID
    };

    // Set render timer
    render.timer = options.timer;

    // Check menus
    if (options.title) render.page.title = options.title;

    // Log timing
    eden.logger.log ('debug', options.path + ' route in ' + (new Date ().getTime () - render.timer.start) + 'ms', {
      'class' : (route && route.type) ? route.type.toUpperCase () + ' ' + route.class + '.' + route.fn : 'no route'
    });

    // Create state
    const state = {};

    // Loop options
    for (const key in options) {
      // Check if in remove
      if (!remove.includes (key)) {
        // Add to state
        state[key] = options[key];
      }
    }

    // Run view state hook
    await eden.hook ('view.state', state);

    // Set page state
    render.state = state;

    // Run view compile hook
    await eden.hook ('view.compile', render);

    // Check if is JSON
    if (options.isJSON) {
      // Sanitise for JSON
      delete render.timer;
      delete render.config;
      delete render.session;

      // Run view json hook
      await eden.hook ('view.json', render);

      // Run callback
      return callback (null, JSON.stringify (render));
    }

    // Set render timer
    render.timer.render = new Date ().getTime ();

    // Do try/catch
    try {
      // Set page
      let page = '<!DOCTYPE html>';

      // Add to page
      page += '<html lang="' + options.language + '">';
      page += '<head>';

      // Set head
      let head = '';

      // Run view head hook
      await eden.hook ('view.head', head, () => {
        // Add to head
        head += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
        head += '<title>' + (render.page.title ? render.page.title + ' | ' : '') + render.config.title + '</title>';
        head += '<link rel="stylesheet" href="' + (config.get ('cdn.url') || '/') + 'public/css/app.min.css' + (config.get ('version') ? '?v=' + config.get ('version') : '') + '" data-eden="head-start">';
        head += render.page.head || '';
        head += '<meta name="eden" value="head-end" data-eden="head-end">';
      });

      // Add head to page
      page += head + '</head>';
      page += '<body' + (render.page.class ? ' class="' + render.page.class + '"' : '') + '>';

      // Set compiled element
      let compiled = '';

      // Run view render hook
      await eden.hook ('view.render', {
        'req'    : req,
        'res'    : res,
        'render' : render
      }, async () => {
        // Compile view
        compiled = await eden.view (render);
      });

      // Add to page
      page += compiled;

      // Set foot
      let foot = '';

      // Run view foot hook
      await eden.hook ('view.foot', ({
        'render' : render,
        'foot'   : foot
      }), () => {
        // Delete session
        delete render.session;

        // Add to foot
        foot += '<!-- DATA.START --><script data-eden="before-user">window.eden = JSON.parse (decodeURIComponent (atob ("' + new Buffer (encodeURIComponent (JSON.stringify (render))).toString ('base64') + '")));</script><!-- DATA.END -->';
        foot += '<!-- USER.START -->';

        // Check user
        if (render.user && Object.keys (render.user).length) foot += '<script data-eden="before-script">window.eden.user = JSON.parse (decodeURIComponent (atob ("' + new Buffer (encodeURIComponent (JSON.stringify (render.user))).toString ('base64') + '")));</script>';

        // Add to foot
        foot += '<!-- USER.END -->';
        foot += '<script data-eden="script" type="text/javascript" src="' + (config.get ('cdn.url') || '/') + 'public/js/app.min.js' + (config.get ('version') ? '?v=' + config.get ('version') : '') + '"></script>';
        foot += render.page.script || '';
      });

      // Add foot to page
      page += foot + '</body>';
      page += '</html>';

      // Log rendered to debug
      eden.logger.log ('debug', render.mount.path + ' rendered in ' + (new Date ().getTime () - render.timer.start) + 'ms', {
        'class' : (route && route.type) ? route.type.toUpperCase () + ' ' + route.class + '.' + route.fn : 'no route'
      });

      // Run view rendered hook
      await eden.hook ('view.rendered', {
        'render' : render,
        'page'   : page
      });

      // Run callback
      return callback (null, page);
    } catch (e) {
      // Run error
      eden.error (e);

      // Run callback
      return callback (e);
    }
  }
}

/**
 * Export view class
 *
 * @type {View}
 */
exports = module.exports = new View ();
