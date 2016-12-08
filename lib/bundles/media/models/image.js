/**
 * Created by Awesome on 2/23/2016.
 */

// use strict
'use strict';

// require dependencies
var fs     = require ('fs');
var path   = require ('path');
var sharp  = require ('sharp');
var model  = require ('model');
var crypto = require ('crypto');

// require local dependencies
var config = require ('app/config');

/**
 * create image model
 */
class image extends model {
  /**
   * construct image model
   *
   * @param a
   * @param b
   */
  constructor (a, b) {
    // run super
    super (a, b);

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
    // load image
    var img  = sharp (buffer);
    var meta = await img.metadata ();

    // set hash
    this.set ('ext',  '.' + meta.format);
    this.set ('meta', meta);

    // get path
    var full   = await this._path (true);
    var hash   = await this._rand ();
    var local  = await this._path ();
    var exists = true;

    // loop to check
    while (exists) {
      // check database for image
      var Image = await image.count ({
        'path' : exists,
        'hash' : hash
      });

      // check if image exists
      if (!Image) {
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
    fs.writeFileSync (full + '/' + this.get ('hash') + this.get ('ext'), buffer);

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
  async file (file, name) {
    // check if file exists
    if (!fs.existsSync (file)) {
      // throw error
      throw new Error ('Image file does not exist in ' + file);
    }

    // get path
    var full   = await this._path (true);
    var hash   = await this._rand ();
    var local  = await this._path ();
    var exists = true;

    // loop to check
    while (exists) {
      // check database for image
      var Image = await image.count ({
        'path' : local,
        'hash' : hash
      });

      // check if image exists
      if (!Image) {
        exists = false;
      } else {
        hash = await this._rand ();
      }
    }

    // load image
    var img  = sharp (file);
    var meta = await img.metadata ();

    // set name
    this.set ('name', name || (hash + '.' + meta.format));

    // set hash
    this.set ('ext',  '.' + meta.format);
    this.set ('meta', meta);
    this.set ('hash', hash);

    // check directory exists
    await this._check ();

    // move to correct directory
    fs.renameSync (file, full + '/' + this.get ('hash') + this.get ('ext'));

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
      'id'   : this.get ('_id') ? this.get ('_id').toString () : false,
      'path' : this.get ('dir') + '/' + this.get ('type') + '/' + this.get ('sub') + '/' + this.get ('hash') + this.get ('ext')
    };
  }

  /**
   * get path
   *
   * @param {Boolean} full
   *
   * @return {String} path
   */
  async _path (full) {
    // get path
    var dir  = this.get ('dir')  || config.media.dir;
    var sub  = this.get ('sub')  || (new Date ().toISOString ().slice (0, 10).split ('-').join ('') + '/' + await this._rand ());
    var type = this.get ('type') || 'image';

    // set information
    this.set ('dir',  dir);
    this.set ('sub',  sub);
    this.set ('type', type);

    // put directory together
    var str = dir + '/' + type + '/' + sub;

    // check if full
    if (full) {
      // get full path
      return global.appRoot + '/www/public/' + str;
    } else {
      // get relative path
      return str;
    }
  }

  /**
   * check directory
   */
  async _check () {
    // set path
    this.set ('path', await this._path ());

    // check directory exists
    var full  = await this._path (true);
    var parts = full.replace (/\/$/, '').split ('/');

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
    // return new Promise
    return new Promise ((resolve, reject) => {
      // crypto random byes
      crypto.randomBytes (48, (err, buffer) => {
        // resolve random string
        resolve (buffer.toString ('hex').substring (0, 12));
      });
    });
  }

  /**
   * remove image
   */
  async _remove (next) {
    // check if exists
    if (!fs.existsSync (global.appRoot + '/www/public/' + this.get ('path') + '/' + this.get ('hash') + this.get ('ext'))) {
      // yield next
      return await next;
    }

    // remove file
    fs.unlinkSync (global.appRoot + '/www/public/' + this.get ('path') + '/' + this.get ('hash') + this.get ('ext'));

    // check if files
    if (!fs.readdirSync (global.appRoot + '/www/public/' + this.get ('path')).length) {
      // remove directory
      fs.rmdirSync (global.appRoot + '/www/public/' + this.get ('path'));
    }

    // check if files
    if (!fs.readdirSync (path.dirname (global.appRoot + '/www/public/' + this.get ('path'))).length) {
      // remove directory
      fs.rmdirSync (path.dirname (global.appRoot + '/www/public/' + this.get ('path')));
    }

    // await next
    await next;
  }
}

/**
 * export image model
 *
 * @type {image}
 */
module.exports = image;
