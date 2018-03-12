
// require dependencies
const eden = require ('eden');

// require local dependencies
const config = require ('config');

/**
 * create view class
 */
class view {

  /**
   * construct riot engine class
   */
  constructor () {
    // bind methods
    this.render = this.render.bind (this);
  }

  /**
   * create email template
   *
   * @param  {String} template
   * @param  {Object} options
   *
   * @return Promise
   */
  async email (template, options) {
    // set config
    options.config = {
      'cdn'    : config.get ('cdn')  || false,
      'logo'   : config.get ('logo') || false,
      'title'  : config.get ('title'),
      'domain' : config.get ('domain'),
      'socket' : config.get ('socket')
    };

    // do hook
    await eden.hook ('email.compile', options);

    // set compiled
    let compiled = false;

    // create compile string
    await eden.hook ('email.render', {
      'options'  : options,
      'template' : template
    }, async () => {
      // load helpers
      compiled = await eden.email (template, options);
    });

    // return compiled email
    return compiled;
  }

  /**
   * render view
   *
   * @param  {String}    path
   * @param  {Object}    options
   * @param  {Function}  callback
   *
   * @return {*}
   */
  async render (path, options, callback) {
    // load req and res
    let res = options.res;
    let req = res.req;

    // create remove array
    var remove = [
      'i18n', 'res', 'page', 'route', 'layout', '_locals', 'settings', 'head', 'routeStart', 'url', 'path', 'isJSON', 'timer'
    ];

    // set route
    let route = options.route || {};

    // hook route
    await eden.hook ('view.route', route);

    // set render Object
    var render = {
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

    // set render timer
    render.timer = options.timer;

    // check menus
    if (options.title) render.page.title = options.title;

    // log timing
    eden.logger.log ('debug', options.path + ' route in ' + (new Date ().getTime () - render.timer.start) + 'ms', {
      'class' : (route && route.type) ? route.type.toUpperCase () + ' ' + route.class + '.' + route.fn : 'no route'
    });

    // create opts
    let state = {};

    // loop options
    for (var key in options) {
      // check if in remove
      if (remove.indexOf (key) === -1) {
        // add to opts
        state[key] = options[key];
      }
    }

    // hook view state
    await eden.hook ('view.state', state);

    // set page state
    render.state = state;

    // hook view state
    await eden.hook ('view.compile', render);

    // check if should json
    if (options.isJSON) {
      // delete isJSON
      delete render.timer;
      delete render.config;
      delete render.session;

      // return callback
      await eden.hook ('view.json', render);

      // run callback
      return callback (null, JSON.stringify (render));
    }

    // log render start
    render.timer.render = new Date ().getTime ();

    // do try/catch
    try {
      // render page
      let page = '<!DOCTYPE html>';

      // add to page
      page += '<html lang="' + options.language + '">';
      page += '<head>';

      // render head
      let head = '';

      // create head string
      await eden.hook ('view.head', head, () => {
        // render head
        head += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
        head += '<title>' + (render.page.title ? render.page.title + ' | ' : '') + render.config.title + '</title>';
        head += '<link rel="stylesheet" href="' + (config.get ('cdn.url') || '/') + 'public/css/app.min.css' + (config.get ('version') ? '?v=' + config.get ('version') : '') + '" data-eden="head-start">';
        head += render.page.head || '';
        head += '<meta name="eden" value="head-end" data-eden="head-end">';
      });

      // finish head render
      page += head + '</head>';
      page += '<body' + (render.page.class ? ' class="' + render.page.class + '"' : '') + '>';

      // set compiled element
      let compiled = '';

      // create compile string
      await eden.hook ('view.render', {
        'req'    : req,
        'res'    : res,
        'render' : render
      }, async () => {
        // load helpers
        compiled = await eden.view (render);
      });

      // render view
      page += compiled;

      // render foot
      let foot = '';

      // create foot string
      await eden.hook ('view.foot', ({ render, foot }), () => {
        // delete session
        delete render.session;

        // render foot
        foot += '<!-- DATA.START --><script data-eden="before-user">window.eden = JSON.parse (decodeURIComponent (atob ("' + new Buffer (encodeURIComponent (JSON.stringify (render))).toString ('base64') + '")));</script><!-- DATA.END -->';
        foot += '<!-- USER.START -->';
        if (render.user && Object.keys (render.user).length) foot += '<script data-eden="before-script">window.eden.user = JSON.parse (decodeURIComponent (atob ("' + new Buffer (encodeURIComponent (JSON.stringify (render.user))).toString ('base64') + '")));</script>';
        foot += '<!-- USER.END -->';
        foot += '<script data-eden="script" type="text/javascript" src="' + (config.get ('cdn.url') || '/') + 'public/js/app.min.js' + (config.get ('version') ? '?v=' + config.get ('version') : '') + '"></script>';
        foot += render.page.script || '';
      });

      // finish page render
      page += foot + '</body>';
      page += '</html>';

      // log rendered
      eden.logger.log ('debug', render.mount.path + ' rendered in ' + (new Date ().getTime () - render.timer.start) + 'ms', {
        'class' : (route && route.type) ? route.type.toUpperCase () + ' ' + route.class + '.' + route.fn : 'no route'
      });

      // hook compiled
      await eden.hook ('view.rendered', { render, page });

      // return render callback
      return callback (null, page);
    } catch (e) {
      // run error
      eden.error (e);

      // return render callback
      return callback (e);
    }
  }
}

/**
 * export view class
 *
 * @type {view}
 */
exports = module.exports = new view ();
