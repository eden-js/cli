
// require dependencies
const assert = require ('assert');

// require local dependencies
const eden = require ('lib/eden');

// describe eden
describe ('EdenJS Express Router', () => {
  // test standard event emitter functionality
  it ('pass express as router', (done) => {
    // assert express
    assert.equal (typeof eden.router, 'object');

    // run done
    done ();
  });
});
