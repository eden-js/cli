/**
 * Created by Awesome on 2/23/2016.
 */

// use strict
'use strict';

// require dependencies
const fs     = require ('fs-extra');
const path   = require ('path');
const sharp  = require ('sharp');
const model  = require ('model');

// require local dependencies
const config = require ('app/config');

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
    let img  = sharp (buffer);
    let meta = await img.metadata ();

    // set hash
    this.set ('ext',  '.' + meta.format);
    this.set ('meta', meta);

    // get path
    let hash   = await this._rand ();
    let Image  = false;
    let exists = true;

    // loop to check
    while (exists) {
      // check database for image
      Image = await image.count ({
        'path' : this._path (),
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
  async file (file, name) {
    // check if file exists
    if (!fs.existsSync (file)) {
      // throw error
      throw new Error ('Image file does not exist in ' + file);
    }

    // get path
    let hash   = await this._rand ();
    let Image  = false;
    let exists = true;

    // loop to check
    while (exists) {
      // check database for image
      Image = await image.count ({
        'path' : this._path (),
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
    let img  = sharp (file);
    let meta = await img.metadata ();

    // set name
    this.set ('name', name || (hash + '.' + meta.format));

    // set hash
    this.set ('ext',  '.' + meta.format);
    this.set ('meta', meta);
    this.set ('hash', hash);

    // check directory exists
    await this._check ();

    // move to correct directory
    fs.copySync (file, this._path (true) + '/' + this.get ('hash') + this.get ('ext'));

    // set size
    this.set ('size', fs.statSync (this._path (true) + '/' + this.get ('hash') + this.get ('ext')).size);

    // save
    await this.save ()

    // set image
    return this;
  }

  /**
   * creates thumb
   *
   * @param {String} label
   */
  thumb (label) {
    // return sharp
    let load = sharp (this._path (true) + '/' + this.get ('hash') + this.get ('ext'));

    /**
     * set save function
     *
     * @return {Promise}
     */
    load.save = async () => {
      // set thumbs
      let thumbs = this.get ('thumbs') || {};
      let thumb  = thumbs && thumbs[label] ? thumbs[label] : false;

      // delete old thumb
      if (thumb) {
        // check if exists
        if (fs.existsSync (this._path (true) + '/' + this.get ('hash') + '-' + label + thumb.ext)) {
          // unlin old thumb
          fs.unlinkSync (this._path (true) + '/' + this.get ('hash') + '-' + label + thumb.ext);
        }
      }

      // save thumb
      await load.toFile (this._path (true) + '/' + this.get ('hash') + '-' + label + '.' + (load.options.formatOut !== 'input' ? load.options.formatOut : this.get ('meta').format));

      // set thumb
      let Thumb = sharp (this._path (true) + '/' + this.get ('hash') + '-' + label + '.' + (load.options.formatOut !== 'input' ? load.options.formatOut : this.get ('meta').format));
      let meta  = await Thumb.metadata ();

      // set info
      thumb = {
        'ext'   : '.' + meta.format,
        'meta'  : meta,
        'label' : label
      };

      // add to thumbs
      thumbs[label] = thumb;

      // set thumbs
      this.set ('thumbs', thumbs);

      // save this
      await this.save ();
    };

    // return sharp with save handler
    return load;
  }

  /**
   * sanitise image
   *
   * @return {Object} sanitised
   */
  async sanitise () {
    // get thumbs
    let Thumbs = this.get ('thumbs');
    let thumbs = {};

    // loop thumbs
    for (var key in Thumbs) {
      // set thumbs
      thumbs[key] = this.get ('hash') + '-' + Thumbs[key].label + Thumbs[key].ext;
    }

    // return image
    return {
      'id'      : this.get ('_id') ? this.get ('_id').toString () : false,
      'file'    : this.get ('hash') + this.get ('ext'),
      'name'    : this.get ('name'),
      'path'    : this._path (),
      'size'    : this.get ('size'),
      'thumbs'  : thumbs,
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
    var date = new Date ().toISOString ().slice (0, 10).split ('-').join ('');

    // get path
    this.set ('dir',  this.get ('dir')  || config.media.dir);
    this.set ('sub',  this.get ('sub')  || (date + '/' + this._rand ()));
    this.set ('type', this.get ('type') || 'image');

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
      let segment = parts.slice (0, i).join ('/');

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
    // remove thumbs
    let thumbs = this.get ('thumbs') || {};

    // loop thumbs
    for (var label in thumbs) {
      // check thumb
      if (fs.existsSync (this._path (true) + '/' + this.get ('hash') + '-' + label + thumbs[label].ext)) {
        // unlink thumb
        fs.unlinkSync (this._path (true) + '/' + this.get ('hash') + '-' + label + thumbs[label].ext);
      }
    }

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
 * export image model
 *
 * @type {image}
 */
module.exports = image;
