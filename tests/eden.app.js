// use strict
'use strict';

// create eden
var assert  = require ('assert');

// describe eden
describe ('EdenJS Express App', () => {
  // test standard event emitter functionality
  it ('pass express as app', (done) => {
    // assert express
    assert.equal (typeof global.eden.app, 'function');

    // run done
    done ();
  });
});
