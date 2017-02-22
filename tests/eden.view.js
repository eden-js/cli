
// require dependencies
const assert = require ('assert');

// require local dependencies
const eden = require ('lib/eden');

// describe eden
describe ('EdenJS RiotJS view engine', () => {
  // test standard event emitter functionality
  it ('pass express as view', (done) => {
    // assert express
    assert.equal (typeof eden.view, 'function');

    // run done
    done ();
  });
});
