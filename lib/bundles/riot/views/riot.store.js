
/**
 * create riot store
 */
class riotStore {
  /**
   * construct riot store
   */
  constructor () {
    // set observable
    riot.observable (this);
  }
}

// build riot store
let RiotStore = new riotStore ();

// add to riotcontrol
riotcontrol.addStore (RiotStore);
