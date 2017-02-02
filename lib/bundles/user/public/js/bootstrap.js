/**
 * Created by Awesome on 2/6/2016.
 */

// require local dependencies
const riotcontrol = require ('riotcontrol');

// get local dependencies
const store = require ('./store');


/**
 * build bootstrap class
 */
class user {
  /**
   * construct bootstrap class
   */
  constructor () {
    // set mount
    this._store = store;

    // add store to riotcontrol
    riotcontrol.addStore (this._store);
  }
}

/**
 * create window router
 *
 * @type {router}
 */
let User = new user ();
