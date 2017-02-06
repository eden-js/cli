
// create eden
const view   = require ('../lib/utilities/view');
const assert = require ('assert');

// describe eden
describe ('EdenJS RiotJS view engine', () => {
  // test standard event emitter functionality
  it ('pass express as app', (done) => {
    // assert express
    assert.equal (typeof global.eden.app, 'function');

    // run done
    done ();
  });
});
