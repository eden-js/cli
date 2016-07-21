// use strict
'use strict';

// create eden
var assert  = require ('assert');

// describe eden
describe ('EdenJS Logger', () => {
  // test standard event emitter functionality
  it ('should exist within eden core', (done) => {
    // assert logger exists
    assert (global.eden.logger !== false);

    // run done
    done ();
  });

  // test standard event emitter functionality
  it ('should be able to log correctly', (done) => {
    // log message
    global.eden.logger.log ('info', 'test');

    // run done
    done ();
  });
});
