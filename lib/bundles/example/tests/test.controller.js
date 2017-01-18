// use strict
'use strict';

// create eden
var assert  = require ('assert');

// describe eden
describe ('Example Controller', () => {
  // test standard event emitter functionality
  it ('should be required correctly', (done) => {
    // assert express
    global.eden.controller ('example/controllers/example').then (ctrl => {
      // assert controller has action
      assert (typeof ctrl.eden !== 'undefined');

      // run done
      done ();
    });
  });
});
