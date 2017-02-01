
// create eden
const assert = require ('assert');

// describe eden
describe ('EdenJS Logger', () => {
  // test standard event emitter functionality
  it ('exist within eden core', (done) => {
    // assert logger exists
    assert (global.eden.logger !== false);

    // run done
    done ();
  });

  // test standard event emitter functionality
  it ('log correctly', (done) => {
    // log message
    global.eden.logger.log ('info', 'test');

    // run done
    done ();
  });
});
