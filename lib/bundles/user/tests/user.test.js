// use strict
'use strict';

// create eden
const user   = require ('user/models/user');
const assert = require ('assert');
const config = require ('app/config');
const crypto = require ('crypto');

// create test user info
let testInfo = {
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
let testUser = new user ({
  '_id'      : testInfo._id,
  'hash'     : testInfo.hash,
  'balance'  : testInfo.balance,
  'username' : testInfo.username
});

// describe user model
describe ('User Model', () => {
  // test using the correct password
  it ('authenticate using the correct password', (done) => {
    // authenticate user
    testUser.authenticate (testInfo.password).then (authenticated => {
      // assert
      assert.equal (authenticated, true);

      // run done
      done ();
    });
  });

  // test authentication with incorrect password
  it ('fail to authenticate on an incorrect password', (done) => {
    // authenticate user
    testUser.authenticate ('wrongPassword').then (authenticated => {
      // assert
      assert.equal (authenticated.error, true);

      // run done
      done ();
    });
  });

  // test user sanitise
  it ('sanitise the user', (done) => {
    // await sanitised user
    testUser.sanitise ().then (sanitised => {
      // check if id
      assert.equal (testInfo._id, sanitised.id);

      // run done
      done ();
    });
  });
});
