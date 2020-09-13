// Require dependencies
const fs = require('fs-extra');
const extract = require('extract-comments');

/**
 * Create Parser class
 */
class EdenParser {
  /**
   * Construct Parser class
   */
  constructor() {
    // Bind public methods
    this.acl = this.acl.bind(this);
    this.file = this.file.bind(this);
    this.task = this.task.bind(this);
    this.upload = this.upload.bind(this);
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
    const comments = (extract.block(data)).filter(({ code }) => (code.context || {}).name !== 'exports').map(({ value, code, loc }) => {
      // extract tags
      const tags = value.split(/\r\n|\n/g).map((line) => {
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
      return tags.length || (code.context || '').type ? {
        tags : tags.reduce((accum, tag) => {
          // set tags
          if (!accum[tag.tag]) accum[tag.tag] = [];

          // push tag
          accum[tag.tag].push(tag);

          // return accumulated
          return accum;
        }, {}),

        type   : (code.context || '').type || 'method',
        method : (content[loc.end.line].match(/^\s*(?:static\s+)?(?:async\s+)?(?:\*?)\s*(\[Symbol\.[^\]]+\]|[\w$]+|\[.*\])\s*\((?:[^)]*)/) || {})[1],
      } : null;
    }).filter(block => block);

    // get class
    const extracted = comments.find(({ type }) => type === 'class') || {
      tags : [],
    };

    // set methods
    // eslint-disable-next-line prefer-destructuring
    extracted.file = bundles.pop().split('.')[0];
    extracted.methods = comments.filter(({ type }) => type !== 'class');

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
      acl : tags.acl.map(({ value }) => {
        // check value
        if (value === 'true') return true;
        if (value === 'false') return false;

        // return actual value
        return value;
      }),
      fail : tags.fail ? tags.fail[0].value : null,
    } : {};

    // set acl
    // eslint-disable-next-line prefer-destructuring
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
      fields : tags.upload.length > 1 ? tags.upload.map(({ value }) => value) : undefined,
    } : {};

    // return upload
    return upload;
  }

  /**
   * Parse daemon chunk
   *
   * @param   {*} path
   *
   * @returns {*}
   */
  task(path) {
    // parse file
    const file = this.file(path);

    // Set class in returns
    const task = {
      file     : path,
      name     : file.file,
      task     : ((file.tags.task || [])[0] || {}).value,
      parent   : ((file.tags.parent || [])[0] || {}).value,
      priority : parseInt(((file.tags.priority || [])[0] || {}).value || '10', 10) || 10,
      parallel : !!(file.tags.parallel || []).length,
    };

    // Return returns
    return task;
  }
}

/**
 * Export new Parser instance
 *
 * @type {EdenParser}
 */
module.exports = new EdenParser();
