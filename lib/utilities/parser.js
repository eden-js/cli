// Require dependencies
const fs    = require('fs-extra');
const parse = require('parse-comments');

/**
 * Create Parser class
 */
class Parser {

  /**
   * Construct Parser class
   */
  constructor () {
    // Bind public methods
    this.task       = this.task.bind(this);
    this.daemon     = this.daemon.bind(this);
    this.controller = this.controller.bind(this);

    // Bind private methods
    this._acl     = this._acl.bind(this);
    this._uploads = this._uploads.bind(this);
  }

  /**
   * Parse controller chunk
   *
   * @param   {*} chunk
   *
   * @returns {*}
   */
  controller (chunk) {
    // Get bundles
    let bundles = chunk.path.replace(/\\/g, '/').split('bundles/').pop();

    // Set default variables
    const file     = bundles.replace('.js', '');
    const data     = chunk.contents.toString();
    const comments = parse(data);

    // Set return
    const returns = {
      'api'     : {},
      'calls'   : [],
      'menus'   : {},
      'routes'  : [],
      'classes' : {},
      'sockets' : []
    };

    // Set class in returns
    returns.classes[file] = {
      'acl'      : [],
      'fail'     : false,
      'file'     : file,
      'name'     : '',
      'desc'     : '',
      'mount'    : '/',
      'priority' : 0
    };

    // Loop comments
    for (let a = 0; a < comments.length; a++) {
      // Check if class
      if (comments[a].comment.code.includes('class')) {
        // Set class
        returns.classes[file].name = comments[a].comment.code.split('class')[1].split('extends')[0].trim();
        returns.classes[file].desc = comments[a].description;

        // Check for mount
        if (comments[a].acls)       returns.classes[file].acl      = this._acl(comments[a].acls);
        if (comments[a].fails)      returns.classes[file].fail     = comments[a].fails[0].description;
        if (comments[a].mounts)     returns.classes[file].mount    = comments[a].mounts[0].description;
        if (comments[a].priorities) returns.classes[file].priority = parseInt(comments[a].priorities[0].description);
      }

      // Check routes
      if (comments[a].routes) {
        // Set function
        let fn = comments[a].comment.code.split('(')[0].trim();

        // Set fn
        fn = fn.split(' ').length > 1 ? fn.split(' ')[fn.split(' ').length - 1] : fn;

        // Loop routes
        for (let b = 0; b < comments[a].routes.length; b++) {
          // Set route
          let route = {
            'fn'       : fn,
            'acl'      : comments[a].acls ? returns.classes[file].acl.concat(this._acl(comments[a].acls)) : returns.classes[file].acl,
            'fail'     : comments[a].fails ? comments[a].fails[0].description : returns.classes[file].fail,
            'type'     : comments[a].routes[b].type.toLowerCase(),
            'desc'     : comments[a].description,
            'view'     : comments[a].views ? comments[a].views[0].description : false,
            'class'    : file,
            'cache'    : comments[a].caches ? {
              'ttl'  : comments[a].ttl ? parseInt(comments[a].ttl[0].description) : (60 * 60 * 1000),
              'name' : comments[a].caches[b].type ? comments[a].caches[b].description.toLowerCase().trim() : comments[a].routes[b].type.toLowerCase().trim() + ':' + comments[a].routes[b].description.trim(),
              'type' : comments[a].caches[b].type ? comments[a].caches[b].type.toLowerCase() : comments[a].caches[b].description.replace('{', '').replace('}', '').trim()
            } : null,
            'mount'    : returns.classes[file].mount,
            'route'    : comments[a].routes[b].description,
            'title'    : comments[a].titles ? comments[a].titles[0].description : false,
            'layout'   : comments[a].layouts ? comments[a].layouts[0].description : false,
            'upload'   : comments[a].uploads ? this._uploads(comments[a].uploads) : false,
            'priority' : comments[a].priorities ? parseInt(comments[a].priorities[0].description) : returns.classes[file].priority
          };

          // Push to routes
          returns.routes.push(route);
        }

        // Add API documentation
        if (comments[a].api) {
          // Get route
          let route = (returns.classes[file].mount + comments[a].routes[0].description).split('//').join('/');

          // Set logic
          returns.api[route] = {
            'fn'    : fn,
            'acl'   : comments[a].acls ? returns.classes[file].acl.concat(this._acl(comments[a].acls)) : returns.classes[file].acl,
            'api'   : comments[a].api.replace('true', '').trim(),
            'type'  : 'route',
            'route' : route,
            'class' : {
              'file' : file,
              'name' : returns.classes[file].name,
              'desc' : returns.classes[file].desc
            },
            'title'       : comments[a].titles ? comments[a].titles[0].description : comments[a].description,
            'method'      : comments[a].routes[0].type.toLowerCase(),
            'upload'      : comments[a].uploads ? this._uploads(comments[a].uploads) : false,
            'request'     : comments[a]['api.request'] ? eval('(' + comments[a]['api.request'].replace('true', '').trim() + ')') : null,
            'response'    : comments[a]['api.request'] ? eval('(' + comments[a]['api.response'].replace('true', '').trim() + ')') : null,
            'description' : comments[a].description
          };
        }

        // Check if menus
        if (comments[a].menus) {
          // Loop menus
          for (let c = 0; c < comments[a].menus.length; c++) {
            // Set path
            let path = (returns.classes[file].mount + (comments[a].routes ? comments[a].routes[0].description : '/')).split('//').join('/');

            // Add to path
            path = path.length > 1 ? path.replace(/\/$/, '') : path;

            // Check if menu exists
            if (!returns.menus[comments[a].menus[c].type]) returns.menus[comments[a].menus[c].type] = [];

            // Push to menus
            returns.menus[comments[a].menus[c].type].push({
              'acl'      : comments[a].acls ? returns.classes[file].acl.concat(this._acl(comments[a].acls)) : returns.classes[file].acl,
              'icon'     : comments[a].icons ? comments[a].icons[0].description : false,
              'route'    : path,
              'title'    : comments[a].menus[c].description,
              'parent'   : comments[a].parents ? comments[a].parents[0].description : false,
              'priority' : comments[a].priorities ? parseInt(comments[a].priorities[0].description) : returns.classes[file].priority
            });
          }
        }
      }

      // Check sockets
      if (comments[a].sockets) {
        // Set function
        let fn = comments[a].comment.code.split('(')[0].trim();

        // Add to fn
        fn = fn.split(' ').length > 1 ? fn.split(' ')[fn.split(' ').length - 1] : fn;

        // Loop routes
        for (let d = 0; d < comments[a].sockets.length; d++) {
          // Set route
          let socket = {
            'fn'       : fn,
            'acl'      : comments[a].acls ? returns.classes[file].acl.concat(this._acl(comments[a].acls)) : returns.classes[file].acl,
            'desc'     : comments[a].description,
            'name'     : comments[a].sockets[d].type ? comments[a].sockets[d].type : comments[a].sockets[d].description.replace('{', '').replace('}', ''),
            'class'    : file,
            'priority' : comments[a].priorities ? parseInt(comments[a].priorities[0].description) : returns.classes[file].priority
          };

          // Push to routes
          returns.sockets.push(socket);
        }
      }

      // Check sockets
      if (comments[a].calls) {
        // Set function
        let fn = comments[a].comment.code.split('(')[0].trim();

        // Add to fn
        fn = fn.split(' ').length > 1 ? fn.split(' ')[fn.split(' ').length - 1] : fn;

        // Loop routes
        for (let d = 0; d < comments[a].calls.length; d++) {
          // Set route
          let socket = {
            'fn'       : fn,
            'acl'      : comments[a].acls ? returns.classes[file].acl.concat(this._acl(comments[a].acls)) : returns.classes[file].acl,
            'desc'     : comments[a].description,
            'name'     : comments[a].calls[d].type ? comments[a].calls[d].type : comments[a].calls[d].description.replace('{', '').replace('}', ''),
            'class'    : file,
            'priority' : comments[a].priorities ? parseInt(comments[a].priorities[0].description) : returns.classes[file].priority
          };

          // Push to routes
          returns.calls.push(socket);
        }

        // Add API documentation
        if (comments[a].api) {
          // Get route
          let route = (returns.classes[file].mount + comments[a].routes[0].description).split('//').join('/');

          // Set logic
          returns.api[route] = {
            'fn'    : fn,
            'acl'   : comments[a].acls ? returns.classes[file].acl.concat(this._acl(comments[a].acls)) : returns.classes[file].acl,
            'api'   : comments[a].api.replace('true', '').trim(),
            'call'  : comments[a].calls[0].type ? comments[a].calls[0].type : comments[a].calls[0].description.replace('{', '').replace('}', ''),
            'type'  : 'call',
            'class' : {
              'file' : file,
              'name' : returns.classes[file].name,
              'desc' : returns.classes[file].desc
            },
            'title'       : comments[a].titles ? comments[a].titles[0].description : comments[a].description,
            'request'     : comments[a]['api.request'] ? eval('(' + comments[a]['api.request'].replace('true', '').trim() + ')') : null,
            'response'    : comments[a]['api.request'] ? eval('(' + comments[a]['api.response'].replace('true', '').trim() + ')') : null,
            'description' : comments[a].description
          };
        }
      }
    }

    // Return returns
    return returns;
  }

  /**
   * Parse daemon chunk
   *
   * @param   {*} chunk
   *
   * @returns {*}
   */
  daemon (chunk) {
    // Get bundles
    let bundles = chunk.path.replace(/\\/g, '/').split('bundles/').pop();

    // Set default variables
    const file     = bundles.replace('.js', '');
    const data     = chunk.contents.toString();
    const comments = parse(data);

    // Set return
    let returns = {
      'daemons' : {}
    };

    // Set class in returns
    returns.daemons[file] = {
      'name'    : '',
      'desc'    : '',
      'express' : false,
      'compute' : false
    };

    // Loop comments
    for (let a = 0; a < comments.length; a++) {
      // Check if class
      if (!comments[a].comment.code.includes('class')) continue;

      // Set class
      returns.daemons[file].name = comments[a].comment.code.split('class')[1].split('extends')[0].trim();
      returns.daemons[file].desc = comments[a].description;

      // Set express and compute threads
      let express = false;
      let compute = false;

      // Check express
      if (comments[a].express === 'true' || comments[a].express === true) {
        // Set express true
        express = true;
      } else if (comments[a].express && comments[a].express.length) {
        // Set express as array
        express = Array.isArray(comments[a].express) ? comments[a].express.map(Number) : [parseInt(comments[a].express)];
      }

      // Check express
      if (comments[a].compute === 'true' || comments[a].compute === true) {
        // Set express true
        compute = true;
      } else if (comments[a].compute && comments[a].compute.length) {
        // Set express as array
        compute = Array.isArray(comments[a].compute) ? comments[a].compute.map(Number) : [parseInt(comments[a].compute)];
      }

      // Check for mount
      if (comments[a].express) returns.daemons[file].express = express;
      if (comments[a].compute) returns.daemons[file].compute = compute;
    }

    // Return returns
    return returns;
  }

  /**
   * Parse daemon chunk
   *
   * @param   {*} path
   *
   * @returns {*}
   */
  task (path) {
    // Get bundles
    let bundles = path.replace(/\\/g, '/').split('bundles/');

    // Set default variables
    const file     = bundles.join('bundles/');
    const data     = fs.readFileSync(path, 'utf8');
    const comments = parse(data);

    // Set class in returns
    let task = {
      'file'   : file,
      'name'   : '',
      'desc'   : '',
      'task'   : false,
      'watch'  : false,
      'after'  : [],
      'before' : []
    };

    // Loop comments
    for (let a = 0; a < comments.length; a++) {
      // Check if class
      if (!comments[a].comment.code.includes('class')) continue;

      // Set class
      task.name = comments[a].comment.code.split('class')[1].split('extends')[0].split('{')[0].trim();
      task.desc = comments[a].description;

      // Check for mount
      if (comments[a].tasks)  task.task  = comments[a].tasks[0].description;
      if (comments[a].watchs) task.watch = true;

      // Do afters
      if (comments[a].afters) {
        // Loop afters
        for (let b = 0; b < comments[a].afters.length; b++) {
          // Add afters
          task.after.push(comments[a].afters[b].description);
        }
      }

      // Do afters
      if (comments[a].befores) {
        // Loop afters
        for (let c = 0; c < comments[a].befores.length; c++) {
          // Add afters
          task.before.push(comments[a].befores[c].description);
        }
      }
    }

    // Return returns
    return task;
  }

  /**
   * Returns acl array for tag
   *
   * @param   {array} tags
   *
   * @returns {*}
   *
   * @private
   */
  _acl (tags) {
    // Set acls
    let returns = [];

    // Loop tags
    for (let i = 0; i < tags.length; i++) {
      // Add to returns
      returns.push(tags[i].description === 'true' || tags[i].description === 'false' ? tags[i].description === 'true' : tags[i].description);
    }

    // Return returns
    return returns;
  }

  /**
   * Returns uploads array for route
   *
   * @param   {array} tags
   *
   * @returns {*}
   *
   * @private
   */
  _uploads (tags) {
    // Check for only type
    if (tags[0].description.includes('{')) {
      // Replace type
      tags[0].type = tags[0].description.replace('{', '').replace('}', '');
    }

    // Set uploads
    let upload = {};

    // Alter upload
    upload.type   = (tags.length > 1) ? 'fields' : (tags[0].type && tags[0].type ? tags[0].type : 'array');
    upload.fields = [];

    // Loop tags
    for (let i = 0; i < tags.length; i++) {
      // Set fields
      let field = {};

      // Check name
      field.name = (tags[i].name && tags[i].name.length ? tags[i].name : tags[i].description).trim();

      // Set max count
      field.maxCount = (tags[i].name && tags[i].name.length && tags[i].description && tags[i].description.length) ? parseInt(tags[i].description) : false;

      // Push fields
      upload.fields.push(field);

      // Add to fields
      if (upload.type === 'single') {
        // Break
        break;
      }
    }

    // Return upload configuration
    return upload;
  }

}

/**
 * Export new Parser instance
 *
 * @type {Parser}
 */
exports = module.exports = new Parser();
