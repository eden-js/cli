
// require dependencies
const fs      = require ('fs-extra');
const url     = require ('url');
const uuid    = require ('uuid');
const path    = require ('path');
const model   = require ('model');
const request = require ('request');

/**
 * create file model
 */
class file extends model {

  /**
   * construct file model
   */
  constructor () {
    // run super
    super (...arguments);

    // bind methods
    this.url      = this.url.bind (this);
    this.remove   = this.remove.bind (this);
    this.sanitise = this.sanitise.bind (this);

    // bind create methods
    this.fromURL    = this.fromURL.bind (this);
    this.fromFile   = this.fromFile.bind (this);
    this.fromBuffer = this.fromBuffer.bind (this);

    // bind alias methods
    this.file     = this.fromFile;
    this.buffer   = this.fromBuffer;
    this.download = this.fromURL;
  }

  /**
   * upload with buffer
   *
   * @param {Buffer} buffer
   * @param {String} name
   *
   * @returns {*}
   */
  async fromBuffer (buffer, name) {
    // set extension
    this.set ('ext',  this.get ('ext')  || path.extname (name).replace ('.', ''));
    this.set ('hash', this.get ('hash') || uuid ());

    // ensure tmp dir
    fs.ensureDirSync (global.appRoot + '/app/cache/tmp');

    // move file temporarily
    fs.writeFileSync (global.appRoot + '/app/cache/tmp/' + this.get ('hash'), buffer);

    // return this for chainable
    await this.fromFile (global.appRoot + '/app/cache/tmp/' + this.get ('hash'), name);

    // remove file
    fs.unlinkSync (global.appRoot + '/app/cache/tmp/' + this.get ('hash'));

    // return this
    return this;
  }

  /**
   * set image
   *
   * @param {String} link
   *
   * @returns {*}
   */
  async fromURL (link) {
    // get name
    let name = path.basename (url.parse (link).pathname);

    // set extension
    this.set ('ext',  this.get ('ext')  || path.extname (name).replace ('.', ''));
    this.set ('hash', this.get ('hash') || uuid ());

    // ensure tmp dir
    fs.ensureDirSync (global.appRoot + '/app/cache/tmp');

    // create request
    let res  = request.get (link);
    let dest = fs.createWriteStream (global.appRoot + '/app/cache/tmp/' + this.get ('hash'));

    // res pipe dest
    res.pipe (dest);

    // return Promise
    await new Promise ((resolve) => {
      // resolve on end
      res.on ('end', resolve);
    });

    // do file
    await this.fromFile (global.appRoot + '/app/cache/tmp/' + this.get ('hash'), name);

    // remove file
    fs.unlinkSync (global.appRoot + '/app/cache/tmp/' + this.get ('hash'));

    // return this
    return this;
  }

  /**
   * set image
   *
   * @param {String} location
   * @param {String} name
   *
   * @returns {*}
   */
  async fromFile (location, name) {
    // check if file exists
    if (!fs.existsSync (location)) {
      // throw error
      throw new Error ('Image file does not exist in ' + location);
    }

    // set hash
    this.set ('ext',  this.get ('ext')  || path.extname (name).replace ('.', ''));
    this.set ('hash', this.get ('hash') || uuid ());
    this.set ('name', name || (this.get ('hash')) + this.get ('ext'));
    this.set ('size', fs.statSync (location).size);

    // hook file create
    await this.eden.hook ('file.create', this, async () => {
      // run transport
      await this.eden.register ('asset.transport').push (this, location);

      // save
      await this.save ();
    });

    // set image
    return this;
  }

  /**
   * remove image
   *
   * @returns {*}
   */
  remove () {
    // hook file create
    return this.eden.hook ('file.remove', this, async () => {
      // await asset transport
      await this.eden.register ('asset.transport').remove (this);

      // save
      return super.remove (...arguments);
    });
  }

  /**
   * gets image url
   *
   * @return {String}
   */
  url () {
    // await endpoint
    return this.eden.register ('asset.transport').url (this);
  }

  /**
   * sanitise image
   *
   * @return {Object} sanitised
   */
  async sanitise () {

    // return object
    return {
      'id'      : this.get ('_id') ? this.get ('_id').toString () : null,
      'url'     : await this.url (),
      'name'    : this.get ('name'),
      'hash'    : this.get ('hash'),
      'created' : this.get ('created_at')
    };
  }
}

/**
 * export file model
 *
 * @type {file}
 */
exports = module.exports = file;
