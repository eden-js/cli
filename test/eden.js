// create eden
var eden    = require (global.appRoot + '/lib/eden');
var assert  = require ('assert');
var request = require ('supertest');

// describe eden
describe ('eden', function () {
  it ('should inherit from event emitter', function (done) {
    eden.on   ('foo', done);
    eden.emit ('foo');
  });
});
