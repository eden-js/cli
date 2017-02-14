
// create eden
const assert = require ('assert');

// describe eden
describe ('EdenJS Express Router', () => {
  // test standard event emitter functionality
  it ('pass express as router', (done) => {
    // assert express
    assert.equal (typeof global.eden.router, 'object');

    // run done
    done ();
  });
});
