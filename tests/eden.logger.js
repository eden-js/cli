
// require dependencies
const assert = require ('assert');

// require local dependencies
const eden = require ('lib/eden');

// describe eden
describe ('EdenJS Logger', () => {
  // test standard event emitter functionality
  it ('exist within eden core', (done) => {
    // assert logger exists
    assert (eden.logger !== false);

    // run done
    done ();
  });

  // test standard event emitter functionality
  it ('log correctly', (done) => {
    // log message
    eden.logger.log ('info', 'test');

    // run done
    done ();
  });
});
