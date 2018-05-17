// Use strict


// Create eden
const user   = require('user/models/user');
const assert = require('assert');
const config = require('config');
const crypto = require('crypto');

// Create test user info
let testInfo = {
  '_id'      : 1,
  'balance'  : 10,
  'username' : 'test',
  'password' : 'testPass123'
};

// Create test user password hash
testInfo.hash = crypto
  .createHmac('sha256', config.get('secret'))
  .update(testInfo.password)
  .digest('hex');

// Create test user
let testUser = new user({
  '_id'      : testInfo._id,
  'hash'     : testInfo.hash,
  'balance'  : testInfo.balance,
  'username' : testInfo.username
});

// Describe user model
describe('User Model', () => {
  // Test using the correct password
  it('authenticate using the correct password', (done) => {
    // Authenticate user
    testUser.authenticate(testInfo.password).then((authenticated) => {
      // Assert
      assert.equal(authenticated, true);

      // Run done
      done();
    });
  });

  // Test authentication with incorrect password
  it('fail to authenticate on an incorrect password', (done) => {
    // Authenticate user
    testUser.authenticate('wrongPassword').then((authenticated) => {
      // Assert
      assert.equal(authenticated.error, true);

      // Run done
      done();
    });
  });

  // Test user sanitise
  it('sanitise the user', (done) => {
    // Await sanitised user
    testUser.sanitise().then((sanitised) => {
      // Check if id
      assert.equal(testInfo._id, sanitised.id);

      // Run done
      done();
    });
  });
});
