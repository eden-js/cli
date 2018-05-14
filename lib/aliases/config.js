// Require dependencies
const nconf = require ('nconf');

// Use memory store
nconf.use ('memory', {
  'logicalSeparator' : '.'
});

// Add environment
nconf.env ({
  'logicalSeparator' : '.'
});

// Add file config
nconf.add ('supplied', {
  'type'             : 'literal',
  'store'            : require ('app/config'),
  'logicalSeparator' : '.'
});

// Load default config
nconf.add ('example', {
  'type'             : 'literal',
  'store'            : require ('app/config.example.js'),
  'logicalSeparator' : '.'
});

// Export config
module.exports = nconf;
