
// create eden
const assert = require ('assert');

// describe eden
describe ('EdenJS RiotJS view engine', () => {
  // test standard event emitter functionality
  it ('pass express as view', (done) => {
    // assert express
    assert.equal (typeof global.eden.view, 'function');

    // run done
    done ();
  });
});
