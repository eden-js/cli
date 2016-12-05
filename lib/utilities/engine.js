// use strict
'use strict';

// require dependencies
var riot        = require ('riot');
var glob        = require ('glob');
var path        = require ('path');
var prettyError = require ('pretty-error');

// require local dependencies
var config = require ('app/config');

/**
 * create engine class
 */
class engine {
  /**
   * construct riot engine class
   */
  constructor () {
    // require all tags
    var tagFiles = glob.sync (global.appRoot + '/app/cache/views/**/*.{tag,mixin.js}');

    // loop tag files
    for (var i = 0; i < tagFiles.length; i++) {
      // do try/catch
      try {
        // require tag file
        require (tagFiles[i]);
      } catch (e) {
        // log error
        var pe = new prettyError ();

        // log error
        console.log (pe.render (e));
      }
    }

    // bind methods
    this.email  = this.email.bind (this);
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
  render (filePath, options, callback) {
    // require riot tag
    options.mountPage = filePath.split (path.sep)[filePath.split (path.sep).length - 1].trim ().replace ('.tag', '') + '-page';

    // set route
    let route = options.route;

    // delete frontend options
    delete options.cache;
    delete options.route;
    delete options._locals;
    delete options.settings;

    // set layout
    options.layout = (options.layout ? options.layout : 'main') + '-layout';

    // check if should json
    if (options.isJSON) {
      // delete isJSON
      delete options.isJSON;

      // return callback
      return callback (null, JSON.stringify ({
        'opts': options
      }));
    }

    // set server option
    options.server = true;

    // start timer
    options.routeEnd = new Date ().getTime ();

    // log timing
    global.logger.log ('debug', options.path + ' loaded in ' + (options.routeEnd - options.routeStart) + 'ms', {
      'class' : route ? 'route ' + route.class + '.' + route.fn : 'no route'
    });

    // log render start
    var renderStart = options.routeEnd;

    // do try/catch
    try {
      // render page
      var page = '<!DOCTYPE html>';
      page += '<html>';
      page += '<head>';
      page += '<meta charset="utf-8">';
      page += '<title>' + (options.pagetitle ? options.pagetitle + ' | ' : '') + options.title + '</title>';
      page += '<link rel="stylesheet" href="/public/css/app.min.css' + (config.version ? '?v=' + config.version : '') + '" data-eden="before-head">';
      page += options.head || '';
      page += '</head>';
      page += '<body' + (options.bodyClass ? ' class="' + options.bodyClass + '"' : '') + '>';
      page += riot.render (options.layout, options);

      // delete server
      delete options.server;

      // set before
      var before = options.beforeScript || '';
      var after  = options.afterScript  || '';

      // delete post-render options
      delete options.beforeScript;
      delete options.afterScript;

      // do script section of page
      page += '<script data-eden="before-script">window.eden = JSON.parse (atob ("' + new Buffer (JSON.stringify ({
        'state'  : options,
        'domain' : config.domain,
        'socket' : config.socket
      })).toString ('base64') + '"));</script>';
      page += before || '';
      page += '<script type="text/javascript" src="/public/js/app.min.js' + (config.version ? '?v=' + config.version : '') + '" data-eden="before-afterscript"></script>';
      page += after || '';
      page += '</body>';
      page += '</html>';

      // log rendered
      global.logger.log ('debug', options.path + ' rendered in ' + (new Date ().getTime () - renderStart) + 'ms', {
        'class' : route ? 'route ' + route.class + '.' + route.fn : 'no route'
      });

      // return render callback
      return callback (null, page);

    } catch (e) {
      // log error
      var pe = new prettyError ();

      // log error
      console.log (pe.render (e));

      // return render callback
      return callback (e);
    }
  }

  /**
   * create email
   *
   * @param  {String} template
   * @param  {Object} options
   *
   * @return {Promise}
   */
  async email (template, options) {
    // get email template
    template = (template.indexOf ('-email') === -1) ? template + '-email' : template;

    // create email template
    var email = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
    email += '<html xmlns="http://www.w3.org/1999/xhtml">';
    email += '<head>';
    email += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';
    email += '<meta name="viewport" content="width=device-width, initial-scale=1" />';
    email += options.style || '';
    email += '</head>';
    email += options.bodyTag || '<body>';
    email += riot.render (template, options).replace ('<' + template + '>', '').replace ('</' + template + '>', '');
    email += '</body>';
    email += '</html>';

    // resolve email html
    return email;
  }
}

/**
 * export engine class
 * @type {engine}
 */
module.exports = engine;
