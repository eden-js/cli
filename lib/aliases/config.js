
// require dependencies
const nconf = require ('nconf');

// use memory store
nconf.use ('memory', {
  'logicalSeparator' : '.'
});

// add environment
nconf.env ({
  'logicalSeparator' : '.'
});

// load default config
nconf.add ('example', {
  'type'             : 'literal',
  'store'            : require ('app/config.example.js'),
  'logicalSeparator' : '.'
});

// export config
module.exports = nconf;
