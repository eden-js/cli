// use strict
'use strict';

// create eden
var assert  = require ('assert');

// describe eden
describe ('EdenJS Event Emitter', () => {
  // test standard event emitter functionality
  it ('should allow event emitter functionality', (done) => {
    // set event function
    global.eden.on ('eefn', (data) => {
      // stop listening
      global.eden.off ('eefn');

      // send done function
      done ();
    });

    // emit event
    global.eden.emit ('eefn');
  });


  // test redis event emitter functionality
  it ('should alow event emitter via redis', (done) => {
    // set event function
    global.eden.on   ('eeredis', (channel, data) => {
      // stop listening
      global.eden.off ('eeredis');

      // send done function
      done ();
    }, true);

    // emit event
    global.eden.emit ('eeredis', true, true);
  });


  // test standard event emitter functionality
  it ('should allow event emitter to pass strings', (done) => {
    // set event function
    global.eden.on   ('eestring', (data) => {
      // stop listening
      global.eden.off ('eestring');

      // send done function
      assert (data === 'true');

      // send done
      done ();
    });

    // emit event
    global.eden.emit ('eestring', 'true');
  });


  // test standard event emitter functionality
  it ('should allow event emitter to pass strings via redis', (done) => {
    // set event function
    global.eden.on   ('eestringredis', (channel, data) => {
      // stop listening
      global.eden.off ('eestringredis');

      // send done function
      assert (data === 'true');

      // send done
      done ();
    }, true);

    // emit event
    global.eden.emit ('eestringredis', 'true', true);
  });


  // test standard event emitter functionality
  it ('should allow event emitter to pass objects', (done) => {
    // set event function
    global.eden.on   ('eeobject', (data) => {
      // stop listening
      global.eden.off ('eeobject');

      // send done function
      assert (data.true && data.true === true);

      // send done
      done ();
    });

    // emit event
    global.eden.emit ('eeobject', {
      'true' : true
    });
  });


  // test standard event emitter functionality
  it ('should allow event emitter to pass objects via redis', (done) => {
    // set event function
    global.eden.on   ('eeobjectredis', (channel, data) => {
      // stop listening
      global.eden.off ('eeobjectredis');

      // send done function
      assert (data.true && data.true === true);

      // send done
      done ();
    }, true);

    // emit event
    global.eden.emit ('eeobjectredis', {
      'true' : true
    }, true);
  });
});
