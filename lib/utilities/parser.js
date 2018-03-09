
// require dependencies
const fs    = require ('fs-extra');
const parse = require ('parse-comments');

/**
 * build parser class
 */
class parser {

  /**
   * construct config pipe
   */
  constructor () {
    // bind methods
    this.task       = this.task.bind (this);
    this.daemon     = this.daemon.bind (this);
    this.controller = this.controller.bind (this);

    // bind tag methods
    this._acl     = this._acl.bind (this);
    this._uploads = this._uploads.bind (this);
  }

  /**
   * parse pipe chunk
   *
   * @param {*} chunk
   *
   * @returns {*}
   */
  controller (chunk) {
    // set default variables
    let file     = chunk.path.replace (/\\/g, '/').split ('bundles/')[1].split ('.js')[0];
    let data     = chunk.contents.toString ();
    let comments = parse (data);

    // set return
    let returns = {
      'calls'   : [],
      'menus'   : {},
      'routes'  : [],
      'classes' : {},
      'sockets' : []
    };

    // set class in returns
    returns.classes[file] = {
      'acl'      : [],
      'fail'     : false,
      'file'     : file,
      'name'     : '',
      'desc'     : '',
      'mount'    : '/',
      'priority' : 0
    };

    // loop comments
    for (let a = 0; a < comments.length; a++) {
      // check if class
      if (comments[a].comment.code.indexOf ('class') > -1) {
        // set class
        returns.classes[file].name = comments[a].comment.code.split ('class')[1].split ('extends')[0].trim ();
        returns.classes[file].desc = comments[a].description;

        // check for mount
        if (comments[a].acls)       returns.classes[file].acl      = this._acl (comments[a].acls);
        if (comments[a].fails)      returns.classes[file].fail     = comments[a].fails[0].description;
        if (comments[a].mounts)     returns.classes[file].mount    = comments[a].mounts[0].description;
        if (comments[a].priorities) returns.classes[file].priority = parseInt (comments[a].priorities[0].description);
      }

      // check routes
      if (comments[a].routes) {
        // set function
        let fn = comments[a].comment.code.split ('(')[0].trim ();

        // add fn
        fn = fn.split (' ').length > 1 ? fn.split (' ')[fn.split (' ').length - 1] : fn;

        // loop routes
        for (let b = 0; b < comments[a].routes.length; b++) {
          // set route
          let route = {
            'fn'       : fn,
            'acl'      : comments[a].acls ? returns.classes[file].acl.concat (this._acl (comments[a].acls)) : returns.classes[file].acl,
            'fail'     : comments[a].fails ? comments[a].fails[0].description : returns.classes[file].fail,
            'type'     : comments[a].routes[b].type.toLowerCase (),
            'desc'     : comments[a].description,
            'view'     : comments[a].views ? comments[a].views[0].description : false,
            'class'    : file,
            'cache'    : comments[a].caches ? {
              'name' : comments[a].caches[b].description.toLowerCase (),
              'type' : comments[a].caches[b].type.toLowerCase ()
            } : null,
            'mount'    : returns.classes[file].mount,
            'route'    : comments[a].routes[b].description,
            'title'    : comments[a].titles ? comments[a].titles[0].description : false,
            'layout'   : comments[a].layouts ? comments[a].layouts[0].description : false,
            'upload'   : comments[a].uploads ? this._uploads (comments[a].uploads) : false,
            'priority' : comments[a].priorities ? parseInt (comments[a].priorities[0].description) : returns.classes[file].priority
          };

          // push to routes
          returns.routes.push (route);
        }

        // check if menus
        if (comments[a].menus) {
          // loop menus
          for (let c = 0; c < comments[a].menus.length; c++) {
            // set path
            let path = (returns.classes[file].mount + (comments[a].routes ? comments[a].routes[0].description : '/')).split ('//').join ('/');

            // add to path
            path = path.length > 1 ? path.replace (/\/$/, '') : path;

            // check if menu exists
            if (!returns.menus[comments[a].menus[c].type]) returns.menus[comments[a].menus[c].type] = [];

            // push to menus
            returns.menus[comments[a].menus[c].type].push ({
              'acl'      : comments[a].acls ? returns.classes[file].acl.concat (this._acl (comments[a].acls)) : returns.classes[file].acl,
              'icon'     : comments[a].icons ? comments[a].icons[0].description : false,
              'route'    : path,
              'title'    : comments[a].menus[c].description,
              'parent'   : comments[a].parents ? comments[a].parents[0].description : false,
              'priority' : comments[a].priorities ? parseInt (comments[a].priorities[0].description) : returns.classes[file].priority
            });
          }
        }
      }

      // check sockets
      if (comments[a].sockets) {
        // set function
        let fn = comments[a].comment.code.split ('(')[0].trim ();

        // add to fn
        fn = fn.split (' ').length > 1 ? fn.split (' ')[fn.split (' ').length - 1] : fn;

        // loop routes
        for (let d = 0; d < comments[a].sockets.length; d++) {
          // set route
          let socket = {
            'fn'       : fn,
            'acl'      : comments[a].acls ? returns.classes[file].acl.concat (this._acl (comments[a].acls)) : returns.classes[file].acl,
            'desc'     : comments[a].description,
            'name'     : comments[a].sockets[d].type ? comments[a].sockets[d].type : comments[a].sockets[d].description.replace ('{', '').replace ('}', ''),
            'class'    : file,
            'priority' : comments[a].priorities ? parseInt (comments[a].priorities[0].description) : returns.classes[file].priority
          };

          // push to routes
          returns.sockets.push (socket);
        }
      }

      // check sockets
      if (comments[a].calls) {
        // set function
        let fn = comments[a].comment.code.split ('(')[0].trim ();

        // add to fn
        fn = fn.split (' ').length > 1 ? fn.split (' ')[fn.split (' ').length - 1] : fn;

        // loop routes
        for (let d = 0; d < comments[a].calls.length; d++) {
          // set route
          let socket = {
            'fn'       : fn,
            'acl'      : comments[a].acls ? returns.classes[file].acl.concat (this._acl (comments[a].acls)) : returns.classes[file].acl,
            'desc'     : comments[a].description,
            'name'     : comments[a].calls[d].type ? comments[a].calls[d].type : comments[a].calls[d].description.replace ('{', '').replace ('}', ''),
            'class'    : file,
            'priority' : comments[a].priorities ? parseInt (comments[a].priorities[0].description) : returns.classes[file].priority
          };

          // push to routes
          returns.calls.push (socket);
        }
      }
    }

    // return returns
    return returns;
  }

  /**
   * parse daemon chunk
   *
   * @param {*} chunk
   *
   * @returns {*}
   */
  daemon (chunk) {
    // set default variables
    let file     = chunk.path.replace (/\\/g, '/').split ('bundles/')[1].split ('.js')[0];
    let data     = chunk.contents.toString ();
    let comments = parse (data);

    // set return
    let returns = {
      'daemons' : {}
    };

    // set class in returns
    returns.daemons[file] = {
      'name'    : '',
      'desc'    : '',
      'express' : false,
      'compute' : false
    };

    // loop comments
    for (var a = 0; a < comments.length; a++) {
      // check if class
      if (comments[a].comment.code.indexOf ('class') === -1) continue;

      // set class
      returns.daemons[file].name = comments[a].comment.code.split ('class')[1].split ('extends')[0].trim ();
      returns.daemons[file].desc = comments[a].description;

      // check for mount
      if (comments[a].express) returns.daemons[file].express = true;
      if (comments[a].compute) returns.daemons[file].compute = true;
    }

    // return returns
    return returns;
  }

  /**
   * parse daemon chunk
   *
   * @param {*} path
   *
   * @returns {*}
   */
  task (path) {
    // set default variables
    let file     = path.replace (/\\/g, '/').split ('bundles/')[1].split ('.js')[0];
    let data     = fs.readFileSync (path, 'utf8');
    let comments = parse (data);

    // set class in returns
    let task = {
      'file'   : file,
      'name'   : '',
      'desc'   : '',
      'task'   : false,
      'watch'  : false,
      'after'  : [],
      'before' : []
    };

    // loop comments
    for (var a = 0; a < comments.length; a++) {
      // check if class
      if (comments[a].comment.code.indexOf ('class') === -1) continue;

      // set class
      task.name = comments[a].comment.code.split ('class')[1].split ('extends')[0].split ('{')[0].trim ();
      task.desc = comments[a].description;

      // check for mount
      if (comments[a].tasks)  task.task  = comments[a].tasks[0].description;
      if (comments[a].watchs) task.watch = true;

      // do afters
      if (comments[a].afters) {
        // loop afters
        for (var b = 0; b < comments[a].afters.length; b++) {
          // add afters
          task.after.push (comments[a].afters[b].description);
        }
      }

      // do afters
      if (comments[a].befores) {
        // loop afters
        for (var c = 0; c < comments[a].befores.length; c++) {
          // add afters
          task.before.push (comments[a].befores[c].description);
        }
      }
    }

    // return returns
    return task;
  }

  /**
   * returns acl array for tag
   *
   * @param {Array} tags
   *
   * @returns {*}
   * @private
   */
  _acl (tags) {
    // set acls
    let returns = [];

    // loop tags
    for (var i = 0; i < tags.length; i++) {
      // add to returns
      returns.push (tags[i].description === 'true' || tags[i].description === 'false' ? tags[i].description === 'true' : tags[i].description);
    }

    // return returns
    return returns;
  }

  /**
   * returns uploads array for route
   *
   * @param {Array} tags
   *
   * @returns {*}
   * @private
   */
  _uploads (tags) {
    // check for only type
    if (tags[0].description.indexOf ('{') > -1) {
      // replace type
      tags[0].type = tags[0].description.replace ('{', '').replace ('}', '');
    }

    // set uploads
    let upload = {};

    // alter upload
    upload.type   = (tags.length > 1) ? 'fields' : (tags[0].type && tags[0].type ? tags[0].type : 'array');
    upload.fields = [];

    // loop tags
    for (var i = 0; i < tags.length; i++) {
      // set fields
      let field = {};

      // check name
      field.name = (tags[i].name && tags[i].name.length ? tags[i].name : tags[i].description).trim ();

      // set max count
      field.maxCount = (tags[i].name && tags[i].name.length && tags[i].description && tags[i].description.length) ? parseInt (tags[i].description) : false;

      // push fields
      upload.fields.push (field);

      // add to fields
      if (upload.type === 'single') {
        // break
        break;
      }
    }

    // return upload configuration
    return upload;
  }
}

/**
 * export config parser
 *
 * @type {parser}
 */
exports = module.exports = new parser ();
