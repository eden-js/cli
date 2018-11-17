// Require dependencies
const nconf = require('nconf');

// Require local dependencies
const configFile = require('app/config');
const configFileExample = require('app/config.example.js');

// Use memory store
nconf.use('memory', {
  logicalSeparator : '.',
});

// Add environment
nconf.env({
  logicalSeparator : '.',
});

// Add file config
nconf.add('supplied', {
  type             : 'literal',
  store            : configFile,
  logicalSeparator : '.',
});

// Load default config
nconf.add('example', {
  type             : 'literal',
  store            : configFileExample,
  logicalSeparator : '.',
});

// Export config
module.exports = nconf;
