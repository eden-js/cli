
// require dependencies
const fs    = require ('fs-extra');
const path  = require ('path');
const model = require ('model');

// require local dependencies
const config = require ('config');

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
    this.file     = this.file.bind (this);
    this.buffer   = this.buffer.bind (this);
    this.sanitise = this.sanitise.bind (this);

    // bind private methods
    this._path   = this._path.bind (this);
    this._check  = this._check.bind (this);
    this._remove = this._remove.bind (this);

    // configure
    this.before ('remove', '_remove');
  }

  /**
   * upload with buffer
   *
   * @param {Buffer} buffer
   * @param {String} name
   */
  async buffer (buffer, name) {
    // set hash
    this.set ('ext', path.extname (name));

    // get path
    let File   = false;
    let hash   = await this._rand ();
    let exists = true;

    // loop to check
    while (exists) {
      // check database for image
      File = await file.count ({
        'path' : this._path (),
        'hash' : hash
      });

      // check if image exists
      if (!File) {
        exists = false;
      } else {
        hash = await this._rand ();
      }
    }

    // set name
    this.set ('name', name || hash + this.get ('ext'));
    this.set ('hash', hash);

    // check directory exists
    await this._check ();

    // write file
    fs.writeFileSync (this._path (true) + '/' + this.get ('hash') + this.get ('ext'), buffer);

    // set size
    this.set ('size', fs.statSync (this._path (true) + '/' + this.get ('hash') + this.get ('ext')).size);

    // save
    await this.save ()

    // return this for chainable
    return this;
  }

  /**
   * set image
   *
   * @param {String} file
   * @param {String} name
   */
  async file (loc, name) {
    // check if file exists
    if (!fs.existsSync (loc)) {
      // throw error
      throw new Error ('Image file does not exist in ' + loc);
    }

    // set hash
    this.set ('ext', path.extname (name));

    // get path
    let File   = false;
    let hash   = await this._rand ();
    let exists = true;

    // loop to check
    while (exists) {
      // check database for image
      File = await file.count ({
        'path' : this._path (),
        'hash' : hash
      });

      // check if image exists
      if (!File) {
        exists = false;
      } else {
        hash = await this._rand ();
      }
    }

    // set name
    this.set ('name', name || (hash + this.get ('ext')));

    // set hash
    this.set ('hash', hash);

    // check directory exists
    await this._check ();

    // move to correct directory
    fs.copySync (loc, this._path (true) + '/' + this.get ('hash') + this.get ('ext'));

    // set size
    this.set ('size', fs.statSync (this._path (true) + '/' + this.get ('hash') + this.get ('ext')).size);

    // save
    await this.save ()

    // set image
    return this;
  }

  /**
   * sanitise image
   *
   * @return {Object} sanitised
   */
  async sanitise () {
    // return image
    return {
      'id'      : this.get ('_id') ? this.get ('_id').toString () : false,
      'file'    : this.get ('hash') + this.get ('ext'),
      'name'    : this.get ('name'),
      'path'    : this._path (),
      'size'    : this.get ('size'),
      'created' : this.get ('created_at')
    };
  }

  /**
   * get path
   *
   * @param {Boolean} full
   *
   * @return {String} path
   */
  _path (full) {
    // set date
    let date = new Date ().toISOString ().slice (0, 10).split ('-').join ('');

    // get path
    this.set ('dir',  this.get ('dir')  || config.get ('media.dir'));
    this.set ('sub',  this.get ('sub')  || (date + '/' + this._rand ()));
    this.set ('type', this.get ('type') || 'file');

    // get path
    let pth = this.get ('dir') + '/' + this.get ('type') + '/' + this.get ('sub');

    // set path
    this.set ('path', pth);

    // return path
    if (!full) return pth;

    // return full path
    return global.appRoot + '/www/public/' + pth;
  }

  /**
   * check directory
   */
  async _check () {
    // check directory exists
    let full  = this._path (true);
    let parts = full.replace (/\/$/, '').split ('/');

    // loop parts
    for (var i = 1; i <= parts.length; i++) {
      // get segment
      var segment = parts.slice (0, i).join ('/');

      // check segment
      if (segment.length === 0) continue;

      // check if exists then create
      if (!fs.existsSync (segment)) fs.mkdirSync (segment, '0755');
    }
  }

  /**
   * generate random string
   *
   * @return {String} random
   */
  _rand () {
    let text     = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // loop possible
    for (var i = 0; i < 10; i++) {
      // add character
      text += possible.charAt (Math.floor (Math.random () * possible.length));
    }

    // return text
    return text;
  }

  /**
   * remove image
   */
  async _remove (next) {
    // check if exists
    if (fs.existsSync (global.appRoot + '/www/public/' + this._path () + '/' + this.get ('hash') + this.get ('ext'))) {
      fs.unlinkSync (global.appRoot + '/www/public/' + this._path () + '/' + this.get ('hash') + this.get ('ext'));
    }

    // check if files
    if (!fs.readdirSync (global.appRoot + '/www/public/' + this._path ()).length) {
      // remove directory
      fs.rmdirSync (global.appRoot + '/www/public/' + this._path ());
    }

    // check if files
    if (!fs.readdirSync (path.dirname (global.appRoot + '/www/public/' + this._path ())).length) {
      // remove directory
      fs.rmdirSync (path.dirname (global.appRoot + '/www/public/' + this._path ()));
    }

    // await next
    await next;
  }
}

/**
 * export file model
 *
 * @type {file}
 */
exports = module.exports = file;
