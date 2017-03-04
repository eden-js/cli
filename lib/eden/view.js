// use strict
'use strict';

// require dependencies
const eden = require ('eden');
const glob = require ('glob');

// require local dependencies
const config = require ('app/config');

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
      'i18n', 'res', 'page', 'cache', 'route', 'layout', '_locals', 'settings', 'head', 'routeStart', 'url', 'path', 'isJSON', 'timer'
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
        'cdn'    : config.cdn  || false,
        'logo'   : config.logo || false,
        'title'  : config.title,
        'domain' : config.domain,
        'socket' : config.socket
      }
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
      page += '<html>';
      page += '<head>';

      // render head
      let head = '';

      // create head string
      await eden.hook ('view.head', head, async () => {
        // render head
        head += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
        head += '<title>' + (render.page.title ? render.page.title + ' | ' : '') + render.config.title + '</title>';
        head += '<link rel="stylesheet" href="/public/css/app.min.css' + (config.version ? '?v=' + config.version : '') + '" data-eden="head">';
        head += render.page.head || '';
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
      await eden.hook ('view.foot', foot, async () => {
        // render foot
        foot += '<script data-eden="before-script">window.eden = JSON.parse (atob ("' + new Buffer (JSON.stringify (render)).toString ('base64') + '"));</script>';
        foot += '<script type="text/javascript" src="/public/js/app.min.js' + (config.version ? '?v=' + config.version : '') + '" data-eden="script"></script>';
        foot += render.page.script || '';
      });

      // finish page render
      page += foot + '</body>';
      page += '</html>';

      // log rendered
      eden.logger.log ('debug', render.mount.path + ' rendered in ' + (new Date ().getTime () - render.timer.start) + 'ms', {
        'class' : (route && route.type) ? route.type.toUpperCase () + ' ' + route.class + '.' + route.fn : 'no route'
      });

      // return render callback
      return callback (null, page);
    } catch (e) {
      // run error
      eden.error (e);

      // return render callback
      throw callback (e);
    }
  }
}

/**
 * export view class
 *
 * @type {view}
 */
exports = module.exports = view;
