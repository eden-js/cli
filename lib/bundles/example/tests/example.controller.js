// use strict
'use strict';

// require dependencies
const assert  = require ('assert');

// require local dependencies
const eden = require ('lib/eden');

// describe eden
describe ('Example Controller', () => {
  // test controller required correctly
  it ('required', (done) => {
    // assert express
    eden.controller ('example/controllers/example').then (ctrl => {
      // assert controller has action
      assert (typeof ctrl.eden !== 'undefined');

      // run done
      done ();
    });
  });

  // test controller extended correctly
  it ('inherit eden', (done) => {
    // assert express
    eden.controller ('example/controllers/example').then (ctrl => {
      // assert controller has action
      assert.equal (eden, ctrl.eden);

      // run done
      done ();
    });
  });
});
