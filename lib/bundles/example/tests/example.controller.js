// use strict
'use strict';

// create eden
var assert  = require ('assert');

// describe eden
describe ('Example Controller', () => {
  // test controller required correctly
  it ('required', (done) => {
    // assert express
    global.eden.controller ('example/controllers/example').then (ctrl => {
      // assert controller has action
      assert (typeof ctrl.eden !== 'undefined');

      // run done
      done ();
    });
  });

  // test controller extended correctly
  it ('inherit eden', (done) => {
    // assert express
    global.eden.controller ('example/controllers/example').then (ctrl => {
      // assert controller has action
      assert.equal (global.eden, ctrl.eden);

      // run done
      done ();
    });
  });
});
