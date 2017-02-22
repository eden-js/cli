
// require dependencies
const assert = require ('assert');

// require local dependencies
const eden = require ('lib/eden');

// describe eden
describe ('EdenJS Event Emitter', () => {
  // test standard event emitter functionality
  it ('enable event emitter functionality', (done) => {
    // set event function
    eden.on ('eefn', (data) => {
      // stop listening
      eden.off ('eefn');

      // send done function
      done ();
    });

    // emit event
    eden.emit ('eefn');
  });


  // test redis event emitter functionality
  it ('enable event emitter via redis', (done) => {
    // set event function
    eden.on ('eeredis', (data) => {
      // stop listening
      eden.off ('eeredis');

      // send done function
      done ();
    }, true);

    // emit event
    eden.emit ('eeredis', true, true);
  });


  // test standard event emitter functionality
  it ('allow event emitter to pass strings', (done) => {
    // set event function
    eden.on ('eestring', (data) => {
      // stop listening
      eden.off ('eestring');

      // send done function
      assert (data === 'true');

      // send done
      done ();
    });

    // emit event
    eden.emit ('eestring', 'true');
  });


  // test standard event emitter functionality
  it ('allow event emitter to pass strings via redis', (done) => {
    // set event function
    eden.on ('eestringredis', (data) => {
      // stop listening
      eden.off ('eestringredis');

      // send done function
      assert (data === 'true');

      // send done
      done ();
    }, true);

    // emit event
    eden.emit ('eestringredis', 'true', true);
  });


  // test standard event emitter functionality
  it ('allow event emitter to pass objects', (done) => {
    // set event function
    eden.on ('eeobject', (data) => {
      // stop listening
      eden.off ('eeobject');

      // send done function
      assert (data.true && data.true === true);

      // send done
      done ();
    });

    // emit event
    eden.emit ('eeobject', {
      'true' : true
    });
  });


  // test standard event emitter functionality
  it ('allow event emitter to pass objects via redis', (done) => {
    // set event function
    eden.on ('eeobjectredis', (data) => {
      // stop listening
      eden.off ('eeobjectredis');

      // send done function
      assert (data.true && data.true === true);

      // send done
      done ();
    }, true);

    // emit event
    eden.emit ('eeobjectredis', {
      'true' : true
    }, true);
  });
});
