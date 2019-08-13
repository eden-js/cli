
// Require dependencies
const Controller = require('controller');

// Require models
const $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} = model('$${model.toLowerCase()}');

// require helpers
const modelHelper = helper('model');
const $${model.toLowerCase()}Helper = helper('$${model.toLowerCase()}');

/**
 * Build $${model.toLowerCase()} controller
 *
 * @acl   admin
 * @fail  next
 * @mount $${mount.length ? mount : model.toLowerCase()}
 */
class $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}Controller extends Controller {
  /**
   * Construct $${model.toLowerCase()} controller
   */
  constructor() {
    // Run super
    super();

    // bind build methods
    this.build = this.build.bind(this);

    // set building
    this.building = this.build();
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * builds $${model.toLowerCase()} controller
   */
  build() {

  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // MODEL LISTEN METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////


  /**
   * socket listen action
   *
   * @param  {String} id
   * @param  {Object} opts
   *
   * @call   model.listen.$${model.toLowerCase()}
   * @return {Async}
   */
  async listenAction(id, uuid, opts) {
    // / return if no id
    if (!id) return;

    // join room
    opts.socket.join(`$${model.toLowerCase()}.${id}`);

    // add to room
    return await modelHelper.listen(opts.sessionID, await $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}.findById(id), uuid, true);
  }

  /**
   * socket listen action
   *
   * @param  {String} id
   * @param  {Object} opts
   *
   * @call   model.deafen.$${model.toLowerCase()}
   * @return {Async}
   */
  async deafenAction(id, uuid, opts) {
    // / return if no id
    if (!id) return;

    // join room
    opts.socket.leave(`$${model.toLowerCase()}.${id}`);

    // add to room
    return await modelHelper.deafen(opts.sessionID, await $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}.findById(id), uuid, true);
  }
}

/**
 * Export $${model.toLowerCase()} controller
 *
 * @type {$${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}Controller}
 */
module.exports = $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}Controller;
