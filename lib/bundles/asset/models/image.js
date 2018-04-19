
// require dependencies
const fs    = require ('fs-extra');
const sharp = require ('sharp');

// require base
const base = model ('file');

/**
 * create image model
 */
class image extends base {

  /**
   * construct image model
   */
  constructor () {
    // run super
    super (...arguments);

    // bind methods
    this.thumb = this.thumb.bind (this);

  }

  /**
   * upload with buffer
   *
   * @param {Buffer} buffer
   * @param {String} name
   *
   * @returns {*}
   */
  async fromBuffer (buffer) {
    // load image
    let img  = sharp (buffer);
    let meta = await img.metadata ();

    // set hash
    this.set ('ext',  meta.format);
    this.set ('meta', meta);

    // run super
    return await super.fromBuffer (...arguments);
  }

  /**
   * set image
   *
   * @param {String} location
   * @param {String} name
   *
   * @return {*}
   */
  async fromFile (location) {
    // load image
    let img  = sharp (await fs.readFile (location));
    let meta = await img.metadata ();

    // set hash
    this.set ('ext',  meta.format);
    this.set ('meta', meta);

    // run super
    return await super.fromFile (...arguments);
  }

  /**
   * creates thumb
   *
   * @param {String} name
   *
   * @returns {String}
   */
  async thumb (name) {
    // return sharp
    let local = global.appRoot + '/app/cache/tmp';

    // ensure sync
    await fs.ensureDir (local);

    // pull to dir
    await this.eden.register ('asset.transport').pull (this, local + '/' + this.get ('hash'));

    // load image
    let load = sharp (await fs.readFile (local + '/' + this.get ('hash')));

    /**
     * set save function
     */
    load.save = async () => {
      // set thumbs
      let thumbs = this.get ('thumbs') || {};
      let thumb  = thumbs && thumbs[name] ? thumbs[name] : false;

      // save thumb
      await load.toFile (local + '/' + this.get ('hash') + '-' + name);

      // load meta
      let meta = sharp (await fs.readFile (local + '/' + this.get ('hash') + '-' + name));

      // set meta
      meta = await meta.metadata ();

      // push to away
      await this.eden.register ('asset.transport').push (this, local + '/' + this.get ('hash') + '-' + name, name + '.' + meta.format);

      // set info
      thumb = {
        'ext'  : meta.format,
        'meta' : meta,
        'name' : name
      };

      // add to thumbs
      thumbs[name] = thumb;

      // set thumbs
      this.set ('thumbs', thumbs);

      // unlink
      await fs.unlink (local + '/' + this.get ('hash'));
      await fs.unlink (local + '/' + this.get ('hash') + '-' + name);

      // save this
      await this.save ();
    };

    // return sharp with save handler
    return load;
  }

  /**
   * remove image
   *
   * @returns {*}
   */
  async remove () {
    // await remove image
    await this.eden.hook ('remove.image', this);

    // loop for transport
    for (let thumb in this.get ('thumbs') || {}) {
      // set thumb
      thumb = this.get ('thumbs')[thumb];

      // await remove
      await this.eden.register ('asset.transport').remove (this, (thumb.name || thumb.label) + '.' + thumb.ext);
    }

    // await next
    return super.remove (...arguments);
  }

  /**
   * sanitise image
   *
   * @return {Object} sanitised
   */
  async sanitise () {
    // get initial sanitised
    let sanitised = await super.sanitise (...arguments);

    // set thumbs
    sanitised.thumbs = this.get ('thumbs') || {};

    // get url for thumbs
    for (let thumb in sanitised.thumbs) {
      // set thumb
      thumb = sanitised.thumbs[thumb];

      // set thumb url
      thumb.url = await this.eden.register ('asset.transport').url (this, (thumb.name || thumb.label) + '.' + thumb.ext);
    }

    // return sanitised
    return sanitised;
  }
}

/**
 * export image model
 *
 * @type {image}
 */
exports = module.exports = image;
