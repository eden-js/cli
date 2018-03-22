
// require dependencies
const uuid   = require ('uuid');
const socket = require ('socket/public/js/bootstrap');
const events = require ('events');

/**
 * create live model class
 *
 * @extends events
 */
class model extends events {

  /**
   * construct model class
   *
   * @param {String} type
   * @param {Object} object
   */
  constructor (type, object) {
    // run super
    super ();

    // set id
    this.__id   = object.id;
    this.__data = object;
    this.__type = type;

    // bind methods
    this.get     = this.get.bind (this);
    this.build   = this.build.bind (this);
    this.refresh = this.refresh.bind (this);
    this.destroy = this.destroy.bind (this);

    // bind private methods
    this._update = this._update.bind (this);

    // build
    this.building = this.build ();
  }

  /**
   * returns data key
   *
   * @param  {String} key
   *
   * @return {*}
   */
  get (key) {
    // return this key
    return this.__data[key];
  }

  /**
   * builds this
   */
  async build () {
    // listen
    await this.listen ();

  }

  /**
   * listens to model by id
   */
  async destory () {
    // call eden
    await socket.call ('live.deafen', this.__type, this.__id, uuid ());

    // add on event
    socket.off ('live.update.' + this.__type + '.' + this.__id, this._update);
  }

  /**
   * refreshes this
   */
  async refresh () {
    // call eden
    let object = await socket.call ('live.refresh', this.__type, this.__id);

    // run update
    this._update (object);
  }

  /**
   * listens to model by id
   */
  async listen () {
    // call eden
    await socket.call ('live.listen', this.__type, this.__id, uuid ());

    // add on event
    socket.on ('live.update.' + this.__type + '.' + this.__id, this._update);
  }

  /**
   * on update
   *
   * @param  {Object} object
   */
  _update (object) {
    // update details
    for (let key in object) {
      // check differences
      if (this.__data[key] !== object[key]) {
        // listen to object key
        this.__data[key] = object[key];

        // emit event
        this.emit (key, object[key]);
      }
    }

    // emit update
    this.emit ('update');
  }
}

/**
 * export live model class
 *
 * @type {model}
 */
exports = module.exports = model;
