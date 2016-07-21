// create eden
var assert  = require ('assert');
var request = require ('supertest');

// describe eden
describe ('eden', function () {
  it ('should inherit from event emitter', function (done) {
    global.eden.on   ('foo', done);
    global.eden.emit ('foo');
  });
});
