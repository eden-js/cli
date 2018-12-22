// Require dependencies
const fs     = require('fs-extra');
const Parser = require('parse-comments');

/**
 * Create Parser class
 */
class EdenParser {
  /**
   * Construct Parser class
   */
  constructor() {
    // Bind public methods
    this.task = this.task.bind(this);
    this.daemon = this.daemon.bind(this);
    this.controller = this.controller.bind(this);

    // Bind private methods
    this._acl = this._acl.bind(this);
    this._uploads = this._uploads.bind(this);

    // create parser
    this._parser = new Parser();
  }

  /**
   * Parse controller chunk
   *
   * @param   {*} chunk
   *
   * @returns {*}
   */
  controller(chunk) {
    // Get bundles
    const bundles = chunk.path.replace(/\\/g, '/').split('bundles/').pop();

    // Set default variables
    const file     = bundles.replace('.js', '');
    const data     = chunk.contents.toString();
    const comments = this._parser.parse(data);

    // Set return
    const returns = {
      api     : {},
      calls   : [],
      menus   : {},
      routes  : [],
      classes : {},
      sockets : [],
    };

    // Set class in returns
    returns.classes[file] = {
      acl      : [],
      fail     : false,
      file,
      name     : '',
      desc     : '',
      mount    : '/',
      priority : 0,
    };

    // Loop comments
    for (const com of comments) {
      // Check if class
      if (com.code.type === 'class') {
        // Set class
        returns.classes[file].name = com.code.context.class;
        returns.classes[file].desc = com.description;

        // Check for mount
        if (com.acls) {
          returns.classes[file].acl = this._acl(com.tags);
        }

        if (com.fails) {
          returns.classes[file].fail = com.fails[0].description;
        }

        if (com.mounts) {
          returns.classes[file].mount = com.mounts[0].description;
        }

        if (com.priorities) {
          returns.classes[file].priority = parseInt(com.priorities[0].description, 10);
        }
      }

      // Alias variables to object props
      const classF = returns.classes[file];

      const comPrio = com.priorities;

      const comApiReq = com['api.request'];
      const comApiRes = com['api.response'];

      // Check routes
      if (com.routes) {
        // Set function
        let fn = com.raw.split('(')[0].trim();

        // Set fn
        fn = fn.split(' ').length > 1 ? fn.split(' ')[fn.split(' ').length - 1] : fn;

        // Loop routes
        for (let b = 0; b < com.routes.length; b += 1) {
          // Alias variables to object props
          const routeB = com.routes[b];
          const routeBDesc = routeB.description;
          const lowRouteBType = routeB.type.toLowerCase();

          let routeCache = null;

          if (com.caches) {
            const cacheB = com.caches[b];

            const cacheBDesc = cacheB.description;

            routeCache = {
              ttl  : com.ttl ? parseInt(com.ttl[0].description, 10) : (60 * 60 * 1000),
              name : cacheB.type ? cacheBDesc.toLowerCase().trim() : `${lowRouteBType.trim()}:${routeBDesc.trim()}`,
              type : cacheB.type ? cacheB.type.toLowerCase() : cacheBDesc.replace(/\{|\}/g, '').trim(),
            };
          }

          // Set route
          const route = {
            fn,
            acl      : com.acls ? classF.acl.concat(this._acl(com.tags)) : classF.acl,
            fail     : com.fails ? com.fails[0].description : classF.fail,
            type     : lowRouteBType,
            desc     : com.description,
            view     : com.views ? com.views[0].description : false,
            class    : file,
            cache    : routeCache,
            mount    : classF.mount,
            route    : routeB.description,
            title    : com.titles ? com.titles[0].description : false,
            layout   : com.layouts ? com.layouts[0].description : false,
            upload   : com.uploads ? this._uploads(com.uploads) : false,
            priority : comPrio ? parseInt(comPrio[0].description, 10) : classF.priority,
          };

          // Push to routes
          returns.routes.push(route);
        }

        // Add API documentation
        if (com.api) {
          // Get route
          const route = (classF.mount + com.routes[0].description).split('//').join('/');

          // Set logic
          returns.api[route] = {
            fn,
            acl   : com.acls ? classF.acl.concat(this._acl(com.tags)) : classF.acl,
            api   : com.api.replace('true', '').trim(),
            type  : 'route',
            route,
            class : {
              file,
              name : classF.name,
              desc : classF.desc,
            },
            title       : com.titles ? com.titles[0].description : com.description,
            method      : com.routes[0].type.toLowerCase(),
            upload      : com.uploads ? this._uploads(com.uploads) : false,
            request     : comApiReq ? eval(`(${comApiReq.replace('true', '').trim()})`) : null,
            response    : comApiReq ? eval(`(${comApiRes.replace('true', '').trim()})`) : null,
            description : com.description,
          };
        }

        // Check if menus
        if (com.menus) {
          // Loop menus
          for (const menu of com.menus) {
            // Set path
            let path = (classF.mount + (com.routes ? com.routes[0].description : '/')).split('//').join('/');

            // Add to path
            path = path.length > 1 ? path.replace(/\/$/, '') : path;

            // Check if menu exists
            if (!returns.menus[menu.type]) returns.menus[menu.type] = [];

            // Push to menus
            returns.menus[menu.type].push({
              acl      : com.acls ? classF.acl.concat(this._acl(com.tags)) : classF.acl,
              icon     : com.icons ? com.icons[0].description : false,
              route    : path,
              title    : menu.description,
              parent   : com.parents ? com.parents[0].description : false,
              priority : comPrio ? parseInt(comPrio[0].description, 10) : classF.priority,
            });
          }
        }
      }

      // Check sockets
      if (com.sockets) {
        // Set function
        let fn = com.raw.split('(')[0].trim();

        // Add to fn
        fn = fn.split(' ').length > 1 ? fn.split(' ')[fn.split(' ').length - 1] : fn;

        // Loop routes
        for (const sock of com.sockets) {
          // Set route
          const socket = {
            fn,
            acl      : com.acls ? classF.acl.concat(this._acl(com.tags)) : classF.acl,
            desc     : com.description,
            name     : sock.type ? sock.type : sock.description.replace(/\{|\}/g, ''),
            class    : file,
            priority : comPrio ? parseInt(comPrio[0].description, 10) : classF.priority,
          };

          // Push to routes
          returns.sockets.push(socket);
        }
      }

      // Check sockets
      if (com.calls) {
        // Set function
        let fn = com.raw.split('(')[0].trim();

        // Add to fn
        fn = fn.split(' ').length > 1 ? fn.split(' ')[fn.split(' ').length - 1] : fn;

        // Loop routes
        for (const call of com.calls) {
          // Set route
          const socket = {
            fn,
            acl      : com.acls ? classF.acl.concat(this._acl(com.tags)) : classF.acl,
            desc     : com.description,
            name     : call.type ? call.type : call.description.replace(/\{|\}/g, ''),
            class    : file,
            priority : comPrio ? parseInt(comPrio[0].description, 10) : classF.priority,
          };

          // Push to routes
          returns.calls.push(socket);
        }

        // Add API documentation
        if (com.api) {
          // Get route
          const route = (classF.mount + com.routes[0].description).split('//').join('/');

          // Set logic
          returns.api[route] = {
            fn,
            acl   : com.acls ? classF.acl.concat(this._acl(com.tags)) : classF.acl,
            api   : com.api.replace('true', '').trim(),
            call  : com.calls[0].type ? com.calls[0].type : com.calls[0].description.replace(/\{|\}/g, ''),
            type  : 'call',
            class : {
              file,
              name : classF.name,
              desc : classF.desc,
            },
            title       : com.titles ? com.titles[0].description : com.description,
            request     : com['api.request'] ? eval(`(${com['api.request'].replace('true', '').trim()})`) : null,
            response    : com['api.request'] ? eval(`(${com['api.response'].replace('true', '').trim()})`) : null,
            description : com.description,
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
  daemon(chunk) {
    // Get bundles
    const bundles = chunk.path.replace(/\\/g, '/').split('bundles/').pop();

    // Set default variables
    const file     = bundles.replace('.js', '');
    const data     = chunk.contents.toString();
    const comments = this._parser.parse(data);

    // Set return
    const returns = {
      daemons : {},
    };

    // Set class in returns
    returns.daemons[file] = {
      name    : '',
      desc    : '',
      express : false,
      compute : false,
    };

    // Loop comments
    for (const com of comments) {
      // Check if class
      if (!com.code.type === 'class') continue;

      // Set class
      returns.daemons[file].name = com.code.context.class;
      returns.daemons[file].desc = com.description;

      // Set express and compute threads
      let express = false;
      let compute = false;

      // Check express
      if (com.express === 'true' || com.express === true) {
        // Set express true
        express = true;
      } else if (com.express && com.express.length && !Array.isArray(com.express)) {
        // Set express as array
        express = [parseInt(com.express, 10)];
      } else if (com.express && com.express.length && Array.isArray(com.express)) {
        express = com.express.map(Number);
      }

      // Check express
      if (com.compute === 'true' || com.compute === true) {
        // Set express true
        compute = true;
      } else if (com.compute && com.compute.length && !Array.isArray(com.compute)) {
        // Set express as array
        compute = [parseInt(com.compute, 10)];
      } else if (com.compute && com.compute.length && Array.isArray(com.compute)) {
        compute = com.compute.map(Number);
      }

      // Check for mount
      if (com.express) returns.daemons[file].express = express;
      if (com.compute) returns.daemons[file].compute = compute;
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
  task(path) {
    // Get bundles
    const bundles = path.replace(/\\/g, '/').split('bundles/');

    // Set default variables
    const file     = bundles.join('bundles/');
    const data     = fs.readFileSync(path, 'utf8');
    const comments = this._parser.parse(data);

    // check class
    const classComment = comments.find(com => (com.code.context || {}).type === 'class');

    // Set class in returns
    const task = {
      file,
      name   : (classComment.code.context || {}).name,
      desc   : classComment.description,
      task   : (classComment.tags.find(tag => tag.title === 'task')).description,
      watch  : !!classComment.tags.find(tag => tag.title === 'watch'),
      after  : classComment.tags.filter(tag => tag.title === 'after').map(tag => tag.description),
      before : classComment.tags.filter(tag => tag.title === 'before').map(tag => tag.description),
    };

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
  _acl(tags) {
    return tags.map((tag) => {
      return tag.description === 'true' || tag.description === 'false' ? tag.description === 'true' : tag.description;
    });
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
  _uploads(tags) {
    // get tags
    const updatedTags = tags;

    // Check for only type
    if (updatedTags[0].description.includes('{')) {
      // Replace type
      updatedTags[0].type = updatedTags[0].description.replace(/\{|\}/g, '');
    }

    // Set uploads
    const upload = {};

    // Alter upload
    if (updatedTags.length > 1) {
      upload.type = 'fields';
    } else {
      upload.type = (updatedTags[0].type && updatedTags[0].type ? updatedTags[0].type : 'array');
    }

    upload.fields = [];

    // Loop tags
    for (const tag of updatedTags) {
      // Set fields
      const field = {};

      // Check name
      field.name = (tag.name && tag.name.length ? tag.name : tag.description).trim();

      // Set max count
      if (tag.name && tag.name.length && tag.description && tag.description.length) {
        field.maxCount = parseInt(tag.description, 10);
      } else {
        field.maxCount = false;
      }

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
 * @type {EdenParser}
 */
module.exports = new EdenParser();
