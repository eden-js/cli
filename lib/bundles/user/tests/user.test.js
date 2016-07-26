// use strict
'use strict';

// create eden
var assert  = require ('assert');
var user = require('user');
var config = require ('config');
var crypto = require ('crypto');

// create test user info
var testId = 1;
var testUsername = 'test';
var testBalance = 10;
var testPass = 'testPass123';
var testHash = crypto
  .createHmac ('sha256', config.secret)
  .update (testPass)
  .digest ('hex');

// create test user
var testUser = new user({
  _id: testId,
  username: testUsername,
  balance: testBalance,
  hash: testHash
});

// describe user model
describe ('User Model', () => {
  it ('should correctly authenticate using the correct password', (done) => {
    testUser.authenticate(testPass).then(error => {
      assert(error, true);
    });

    // run done
    done ();
  });

  it ('should fail to authenticate on an incorrect password', (done) => {
    testUser.authenticate('1').then(error => {
      assert(error, false);
    });

    // run done
    done ();
  });

  it ('should sanitise the user correctly', (done) => {
    assert(testUser.sanitise(), {
      id: testId,
      username: testUsername,
      balance: testBalance,
      hash: testHash
    });

    // run done
    done ();
  });
});
