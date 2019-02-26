// Require dependencies
const fs               = require('fs-extra');
const extractComments  = require('extract-comments');

function parseComments(code) {
  const extractedComments = extractComments(code);
  const codeSplit = code.split(/\r\n|\n/g);

  return extractedComments.map((comment) => {
    const tags = [];
    const descriptionParts = [];

    let descriptionEnded = false;

    if (comment.type === 'BlockComment') {
      const commentLines = comment.value.split(/\r\n|\n/g);

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

    // Bind private methods
    this._acl = this._acl.bind(this);
    this._uploads = this._uploads.bind(this);
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PARSER FUNCTIONS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * parse code
   *
   * @param  {String} path
   * @return {*}
   */
  file(path) {
    // Get bundles
    const bundles = path.replace(/\\/g, '/').split('bundles/');

    // Set default variables
    const data = fs.readFileSync(path, 'utf8');

    // get file
    const content = data.split(/\r\n|\n/g);

    // get comments
    const comments = (extractComments.block(data)).filter(comment => (comment.code.context || {}).name !== 'exports').map((comment) => {
      // extract tags
      const tags = comment.value.split(/\r\n|\n/g).map((line) => {
        // check match
        const match = line.match(/^@(\w+)((?:\s+\S+)*)$/);

        // return
        return match && (match[1] || '').length && Object.keys(match).length ? {
          tag   : match[1].trim(),
          type  : match[2].includes('}') ? match[2].split('{')[1].split('}')[0] : null,
          value : match[2].includes('}') ? match[2].split('}')[1].trim() : (match[2].trim()),
        } : null;
      }).filter(match => match);

      // return block and tags
      return tags.length || (comment.code.context || '').type ? {
        tags : tags.reduce((accum, tag) => {
          // set tags
          if (!accum[tag.tag]) accum[tag.tag] = [];

          // push tag
          accum[tag.tag].push(tag);

          // return accumulated
          return accum;
        }, {}),

        type   : (comment.code.context || '').type || 'method',
        method : (content[comment.loc.end.line].match(/^\s*(?:static\s+)?(?:async\s+)?(?:\*?)\s*(\[Symbol\.[^\]]+\]|[\w$]+|\[.*\])\s*\((?:[^)]*)/) || {})[1],
      } : null;
    }).filter(block => block);

    // get class
    const extracted = comments.find(block => block.type === 'class');

    // set methods
    extracted.file = bundles.pop().split('.')[0];
    extracted.methods = comments.filter(block => block.type !== 'class');

    // return extracted
    return extracted;
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // UTILITY METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////


  /**
   * Returns acl array for tag
   *
   * @param   {array} tags
   *
   * @returns {*}
   *
   * @private
   */
  acl(tags) {
    // set acl
    const acl = tags.acl ? {
      acl : tags.acl.map((tag) => {
        // check value
        if (tag.value === 'true') return true;
        if (tag.value === 'false') return false;

        // return actual value
        return tag.value;
      }),
      fail : tags.fail ? tags.fail[0].value : null,
    } : {};

    // set acl
    if ((acl.acl || []).length === 1) acl.acl = acl.acl[0];

    // return acl
    return acl;
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
  upload(tags) {
    // get upload
    const upload = tags.upload ? {
      type   : tags.upload.length > 1 ? 'fields' : (tags.upload[0].type || 'array'),
      name   : tags.upload.length > 1 ? undefined : tags.upload[0].value,
      fields : tags.upload.length > 1 ? tags.upload.map(field => field.value) : undefined,
    } : {};

    // return upload
    return upload;
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

    // set thread label
    const thread = (com.p.thread || {}).val ? (com.p.thread || {}).val.trim() : null;

    // return object
    return {
      daemons : {
        [file] : {
          thread,

          name        : com !== undefined ? (com.name || com.className) : '',
          description : com !== undefined ? com.description : '',
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
