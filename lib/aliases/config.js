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
  parseValues      : true,
  transform        : (obj) => {
    return {
      key   : obj.key.toLowerCase().replace(/_([a-z])/g, g => g[1].toUpperCase()),
      value : obj.value,
    };
  },
});

// Add file config
nconf.add('supplied', {
  type             : 'literal',
  store            : configFile,
  logicalSeparator : '.',
});

// Load default config
nconf.defaults(configFileExample);

// Export config
module.exports = nconf;
