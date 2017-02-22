
// require dependencies
const assert = require ('assert');

// require local dependencies
const eden = require ('lib/eden');

// describe eden
describe ('EdenJS Globals', () => {
  // test standard event emitter functionality
  it ('has cache function', (done) => {
    // assert logger exists
    assert (typeof cache === 'function');

    // run done
    done ();
  });

  // test standard event emitter functionality
  it ('has model function', (done) => {
    // assert logger exists
    assert (typeof model === 'function');

    // run done
    done ();
  });

  // test standard event emitter functionality
  it ('has helper function', (done) => {
    // assert logger exists
    assert (typeof helper === 'function');

    // run done
    done ();
  });
});
