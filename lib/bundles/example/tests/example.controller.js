// Require dependencies
const assert = require('assert');

// Require local dependencies
const eden = require('lib/eden');

// Describe Eden
describe('Example Controller', () => {
  // Test controller required correctly
  it('required', (done) => {
    // Assert express
    eden.controller('example/controllers/example').then((ctrl) => {
      // Assert controller has action
      assert(typeof ctrl.eden !== 'undefined');

      // Run done
      done();
    });
  });

  // Test controller extended correctly
  it('inherit eden', (done) => {
    // Assert express
    eden.controller('example/controllers/example').then((ctrl) => {
      // Assert controller has action
      assert.equal(eden, ctrl.eden);

      // Run done
      done();
    });
  });
});
