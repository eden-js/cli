// Require dependencies
const nconf = require('nconf');

// Require local dependencies
const configFile = require(`${global.appRoot}/config`); // eslint-disable-line import/no-dynamic-require
const configFileExample = require('lib/baseconfig.js');

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
