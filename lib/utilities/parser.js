// Require dependencies
const fs               = require('fs-extra');
const extractComments  = require('extract-comments');

function parseComments(code) {
  const extractedComments = extractComments(code);
  const codeSplit = code.split('\n');

  return extractedComments.map((comment) => {
    const tags = [];
    const descriptionParts = [];

    let descriptionEnded = false;

    if (comment.type === 'BlockComment') {
      const commentLines = comment.value.split('\n');

      for (const line of commentLines) {
        if (line === '') {
          descriptionEnded = true;
          continue;
        }

        const tagMatch = line.match(/^@(\w+)((?:\s+\S+)*)$/);

        if (tagMatch !== null) {
          descriptionEnded = true;

          let tagType = null;

          const tagParts = tagMatch[2].split(/ /g).filter((tagPart) => { // eslint-disable-line no-loop-func
            if (tagPart === '') {
              return false;
            }

            if (tagPart.startsWith('{') && tagPart.endsWith('}')) {
              tagType = tagPart.slice(1, -1);
              return false;
            }

            return true;
          });

          tags.push({
            parts : tagParts,
            name  : tagMatch[1],
            type  : tagType,

            val   : tagParts[0], // ease of use alias
          });
        } else if (!descriptionEnded) {
          descriptionParts.push(line);
        }
      }
    }

    let className = null;

    if (comment.code !== undefined && comment.code !== null && comment.code.context !== undefined && comment.code.context !== null && comment.code.context.type === 'class') {
      className = comment.code.context.name;
    }

    const methodNameMatch = codeSplit[comment.loc.end.line].match(/^\s*(?:static\s+)?(?:async\s+)?(?:\*?)\s*(\[Symbol\.[^\]]+\]|[\w$]+|\[.*\])\s*\((?:[^)]*)/);

    let methodName = null;

    if (methodNameMatch !== null) {
      [, methodName] = methodNameMatch;
    }

    // Ease of use alias
    const p = {};

    for (const tag of tags) {
      p[tag.name] = tag;
    }

    return {
      className,
      methodName,
      description : descriptionParts.join('\n'),

      type   : comment.type,
      string : comment.value,
      tags   : comment.type === 'BlockComment' ? tags : null,

      p,
    };
  });
}

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
    const comments = parseComments(data);

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
      if (com.type !== 'BlockComment') {
        continue;
      }

      // Check if class
      if (com.className !== null) {
        // Set class
        returns.classes[file].name = com.className;
        returns.classes[file].desc = com.description;

        // Check for mount
        if (com.p.acl) {
          returns.classes[file].acl = this._acl(com.tags.filter(tag => tag.name === 'acl'));
        }

        if (com.p.fail) {
          returns.classes[file].fail = com.p.fail.val;
        }

        if (com.p.mount) {
          returns.classes[file].mount = com.p.mount.val;
        }

        if (com.p.priority) {
          returns.classes[file].priority = parseInt(com.p.priority.val, 10);
        }
      }

      // Alias variables to object props
      const classF = returns.classes[file];

      // const comApiReq = com['api.request'];
      // const comApiRes = com['api.response'];

      const routeTags = com.tags.filter(tag => tag.name === 'route');

      // Check routes
      if (routeTags.length > 0) {
        const cacheTags = com.tags.filter(tag => tag.name === 'cache');

        // Loop routes
        for (let routeI = 0; routeI < routeTags.length; routeI += 1) {
          // Alias variables to object props
          const routeTag = routeTags[routeI];
          const lowRouteType = routeTag.type.toLowerCase();

          let routeCache = null;

          if (cacheTags.length > 0) {
            const cacheTag = cacheTags[routeI];
            const cachePath = cacheTag.val;

            routeCache = {
              ttl  : com.p.ttl ? parseInt(com.p.ttl.val, 10) : (60 * 60 * 1000),
              name : cacheTag.type ? cachePath.toLowerCase().trim() : `${lowRouteType.trim()}:${routeTag.name.trim()}`,
              type : cacheTag.type ? cacheTag.type.toLowerCase() : cachePath.replace(/\{|\}/g, '').trim(),
            };
          }

          // Set route
          const route = {
            fn       : com.methodName,
            acl      : com.p.acl ? classF.acl.concat(this._acl(com.tags.filter(tag => tag.name === 'acl'))) : classF.acl,
            fail     : com.p.fail ? com.p.fail.val : classF.fail,
            type     : lowRouteType,
            desc     : com.description,
            view     : com.p.view ? com.p.view.val : false,
            class    : file,
            cache    : routeCache,
            mount    : classF.mount,
            route    : routeTag.val,
            title    : com.p.title ? com.p.title.val : false,
            layout   : com.p.layout ? com.p.layout.val : false,
            upload   : com.p.upload ? this._uploads(com.tags.filter(tag => tag.name === 'upload'), com) : false,
            priority : com.p.priority ? parseInt(com.p.priority.val, 10) : classF.priority,
          };

          // Push to routes
          returns.routes.push(route);
        }

        // Add API documentation
        if (com.p.api) {
          // Get route
          const route = (classF.mount + com.p.route.name).split('//').join('/');

          // Set logic
          returns.api[route] = {
            fn    : com.methodName,
            acl   : com.p.acl ? classF.acl.concat(this._acl(com.tags.filter(tag => tag.name === 'acl'))) : classF.acl,
            api   : com.p.api.val,
            type  : 'route',
            route,
            class : {
              file,
              name : classF.name,
              desc : classF.desc,
            },
            title       : com.p.title ? com.p.title.val : com.description,
            method      : com.p.route.type.toLowerCase(),
            upload      : com.p.upload ? this._uploads(com.tags.filter(tag => tag.name === 'upload')) : false,
            // request     : comApiReq ? eval(`(${comApiReq.replace('true', '').trim()})`) : null,
            // response    : comApiReq ? eval(`(${comApiRes.replace('true', '').trim()})`) : null,
            description : com.description,
          };
        }

        // Loop menus
        for (const menuTag of (com.tags.filter(tag => tag.name === 'menu') || [])) {
          // Set path
          let path = (classF.mount + (com.p.route ? com.p.route.val : '/')).split('//').join('/');

          // Add to path
          path = path.length > 1 ? path.replace(/\/$/, '') : path;

          // Check if menu exists
          if (!returns.menus[menuTag.type]) returns.menus[menuTag.type] = [];

          // Push to menus
          returns.menus[menuTag.type].push({
            acl      : com.p.acl ? classF.acl.concat(this._acl(com.tags.filter(tag => tag.name === 'acl'))) : classF.acl,
            icon     : com.p.icon ? com.p.icon.parts.join(' ') : false,
            route    : path,
            title    : menuTag.parts.join(' '),
            parent   : com.p.parent ? com.p.parent.val : false,
            priority : com.p.priority ? parseInt(com.p.priority.val, 10) : classF.priority,
          });
        }
      }

      const socketTags = com.tags.filter(tag => tag.name === 'socket');

      // Check sockets
      if (socketTags) {
        // Loop routes
        for (const socketTag of socketTags) {
          // Set route
          const socket = {
            fn       : com.methodName,
            acl      : com.p.acl ? classF.acl.concat(this._acl(com.tags.filter(tag => tag.name === 'acl'))) : classF.acl,
            desc     : com.description,
            name     : socketTag.val,
            class    : file,
            priority : com.p.priority ? parseInt(com.p.priority.val, 10) : classF.priority,
          };

          // Push to routes
          returns.sockets.push(socket);
        }
      }

      const callTags = com.tags.filter(tag => tag.name === 'call');

      // Check sockets
      if (callTags) {
        // Loop routes
        for (const callTag of callTags) {
          // Set route
          const socket = {
            fn       : com.methodName,
            acl      : com.p.acl ? classF.acl.concat(this._acl(com.tags.filter(tag => tag.name === 'acl'))) : classF.acl,
            desc     : com.description,
            name     : callTag.val,
            class    : file,
            priority : com.p.priority ? parseInt(com.p.priority.val, 10) : classF.priority,
          };

          // Push to routes
          returns.calls.push(socket);
        }

        // Add API documentation
        if (com.p.api) {
          // Get route
          const route = (classF.mount + com.p.route.val).split('//').join('/');

          // Set logic
          returns.api[route] = {
            fn    : com.methodName,
            acl   : com.p.acl ? classF.acl.concat(this._acl(com.tags.filter(tag => tag.name === 'acl'))) : classF.acl,
            api   : com.p.api.val,
            call  : com.p.call.type,
            type  : 'call',
            class : {
              file,
              name : classF.name,
              desc : classF.desc,
            },
            title       : com.p.title ? com.p.title.val : com.description,
            // request     : com['api.request'] ? eval(`(${com['api.request'].replace('true', '').trim()})`) : null,
            // response    : com['api.request'] ? eval(`(${com['api.response'].replace('true', '').trim()})`) : null,
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
    const comments = parseComments(data);

    // Find class comment
    const com = comments.find(comment => comment.className !== null);

    // Set express and compute threads
    let express = false;
    let compute = false;

    // Check express
    if (com.p.express !== undefined && (com.p.express.val === 'true' || com.p.express.parts.length === 0)) {
      // Set express true
      express = true;
    } else if (com.p.express !== undefined && com.p.express.parts.length > 1) {
      // Set express as array
      express = com.p.express.parts.map(thread => parseInt(thread, 10));
    }

    // Check compute
    if (com.p.compute !== undefined && (com.p.compute.val === 'true' || com.p.compute.parts.length === 0)) {
      // Set compute true
      compute = true;
    } else if (com.p.compute !== undefined && com.p.compute.parts.length > 1) {
      // Set compute as array
      compute = com.p.compute.parts.map(thread => parseInt(thread, 10));
    }

    // return object
    return {
      daemons : {
        [file] : {
          name        : com !== undefined ? (com.name || com.className) : '',
          description : com !== undefined ? com.description : '',

          express,
          compute,
        },
      },
    };
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
    const comments = parseComments(data);

    // check class
    const com = comments.find(comment => comment.className !== null);

    // Set class in returns
    const task = {
      file,
      name   : com.className,
      desc   : com.description,
      task   : (com.p.task || {}).val,
      watch  : !!com.tags.find(tag => tag.name === 'watch'),
      after  : com.tags.filter(tag => tag.name === 'after').map(tag => tag.val),
      before : com.tags.filter(tag => tag.name === 'before').map(tag => tag.val),
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
      if (tag.val === 'true') return true;
      if (tag.val === 'false') return false;
      return tag.val;
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
    if (updatedTags[0].val && updatedTags[0].val.includes('{')) {
      // Replace type
      updatedTags[0].type = updatedTags[0].val.replace(/\{|\}/g, '');
    }

    // Set uploads
    const upload = {};

    // Alter upload
    if (updatedTags.length > 1) {
      upload.type = 'fields';
    } else {
      upload.type = (updatedTags[0].type ? updatedTags[0].type : 'array');
    }

    upload.fields = [];

    // Loop tags
    for (const tag of updatedTags) {
      // Set fields
      const field = {};

      // Check name
      field.name = tag.val || '';

      // Set max count
      if (tag.val && tag.val.length && tag.parts[1] && tag.parts[1].length) {
        field.maxCount = parseInt(tag.parts[1], 10);
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
