// use strict
'use strict';

// require dependencies
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
  constructor (eden) {
    // set eden
    this._eden = eden;

    // bind methods
    this.render = this.render.bind (this);
  }

  /**
   * render riot tag locally
   *
   * @param  {String}   filePath
   * @param  {*}        options
   * @param  {Function} callback
   *
   * @return {*}
   */
  async render (filePath, options, callback) {
    // create remove array
    var remove = [
      'page', 'cache', 'route', 'layout', '_locals', 'settings', 'head', 'routeStart', 'url', 'path', 'isJSON', 'timer'
    ];

    // set route
    let route = options.route || {};

    // hook route
    await this._eden.hook ('view.route', route);

    // set render Object
    var render = {
      'page'  : options.page,
      'mount' : {
        'url'    : options.url,
        'path'   : options.path || '404',
        'page'   : filePath,
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
    this._eden.logger.log ('debug', options.path + ' start in ' + (render.timer.route - render.timer.start) + 'ms', {
      'class' : (route && route.type) ? route.type.toUpperCase () + ' ' + route.class + '.' + route.fn : 'no route'
    });
    this._eden.logger.log ('debug', options.path + ' route in ' + (new Date ().getTime () - render.timer.start) + 'ms', {
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
    await this._eden.hook ('view.state', state);

    // set page state
    render.state = state;

    // hook view render
    await this._eden.hook ('view.render', render);

    // check if should json
    if (options.isJSON) {
      // delete isJSON
      delete render.timer;
      delete render.config;

      // return callback
      await this._eden.hook ('view.json', render);

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
      page += '<meta charset="utf-8">';
      page += '<title>' + (render.page.title ? render.page.title + ' | ' : '') + render.config.title + '</title>';
      page += '<link rel="stylesheet" href="/public/css/app.min.css' + (config.version ? '?v=' + config.version : '') + '" data-eden="head">';
      page += render.page.head || '';
      page += '</head>';
      page += '<body' + (render.page.class ? ' class="' + render.page.class + '"' : '') + '>';

      // hook stuff
      let compile = await this._eden.hook ('view.compile', {
        'page'   : await this._eden.view (render),
        'render' : render
      });

      // do script section of page
      page += compile.page;
      page += '<script data-eden="before-script">window.eden = JSON.parse (atob ("' + new Buffer (JSON.stringify (render)).toString ('base64') + '"));</script>';
      page += '<script type="text/javascript" src="/public/js/app.min.js' + (config.version ? '?v=' + config.version : '') + '" data-eden="script"></script>';
      page += render.page.script || '';
      page += '</body>';
      page += '</html>';

      // hook page
      await this._eden.hook ('view.page', page);

      // log rendered
      this._eden.logger.log ('debug', render.mount.path + ' rendered in ' + (new Date ().getTime () - render.timer.start) + 'ms', {
        'class' : (route && route.type) ? route.type.toUpperCase () + ' ' + route.class + '.' + route.fn : 'no route'
      });

      // return render callback
      return callback (null, page);
    } catch (e) {
      // run error
      this._eden.error (e);

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
exports = module.exports = view;
