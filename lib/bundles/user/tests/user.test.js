// use strict
'use strict';

// create eden
var user   = require ('user/models/user');
var assert = require ('assert');
var config = require ('app/config');
var crypto = require ('crypto');

// create test user info
var testInfo = {
  '_id'      : 1,
  'balance'  : 10,
  'username' : 'test',
  'password' : 'testPass123'
};

// create test user password hash
testInfo.hash = crypto
  .createHmac ('sha256', config.secret)
  .update (testInfo.password)
  .digest ('hex');

// create test user
var testUser = new user ({
  '_id'      : testInfo._id,
  'hash'     : testInfo.hash,
  'balance'  : testInfo.balance,
  'username' : testInfo.username
});

// describe user model
describe ('User Model', () => {
  // test using the correct password
  it ('should correctly authenticate using the correct password', (done) => {
    // authenticate user
    testUser.authenticate (testInfo.password).then (authenticated => {
      // assert
      assert.equal (authenticated, true);

      // run done
      done ();
    });
  });

  // test authentication with incorrect password
  it ('should fail to authenticate on an incorrect password', (done) => {
    // authenticate user
    testUser.authenticate ('wrongPassword').then (authenticated => {
      // assert
      assert.equal (authenticated.error, true);

      // run done
      done ();
    });
  });

  // test user sanitise
  it ('should sanitise the user correctly', (done) => {
    // await sanitised user
    testUser.sanitise ().then (sanitised => {
      // check if id
      assert.equal (testInfo._id, sanitised.id);

      // run done
      done ();
    });
  });
});
