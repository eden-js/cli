// Require dependencies
const nconf     = require('nconf');
const fs        = require('fs-extra');
const deepMerge = require('deepmerge');
const glob      = require('@edenjs/glob');

// Require local dependencies
const loader            = require('lib/loader');
const configFileExample = require('lib/baseconfig.js');

let mainConfigFile = null;

if (fs.existsSync(`${global.appRoot}/edenappconfig.js`)) {
  mainConfigFile = require(`${global.appRoot}/edenappconfig`); // eslint-disable-line import/no-dynamic-require, global-require
} else {
  // This should be deprecated
  mainConfigFile = require(`${global.appRoot}/config`); // eslint-disable-line import/no-dynamic-require, global-require
}

// Use memory store
nconf.use('memory', {
  logicalSeparator : '.',
});

// Add arguments
nconf.argv({
  expressThreads : {
    alias : 'e',
  },
  computeThreads : {
    alias : 'c',
  },
  logLevel : {
    alias : 'l',
  },
  environment : {
    alias : 'E',
  },

  domain : {
    alias : 'd',
  },
  port : {
    alias : 'p',
  },
  host : {
    alias : 'h',
  },
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
  store            : mainConfigFile,
  logicalSeparator : '.',
});

// Load default config
nconf.defaults(configFileExample);

const configLocations = loader.getFiles(loader.getLocations(nconf.get('modules') || [], false), 'edenconfig.js');

for (const configPath of glob.sync(configLocations)) {
  const configFile = require(`${configPath}`); // eslint-disable-line import/no-dynamic-require, global-require

  for (const key of Object.keys(configFile)) {
    const existing = nconf.get(key);

    // This is unfortunate, nconf should have merging support built in
    if (existing !== undefined) {
      nconf.set(key, deepMerge(existing, configFile[key]));
    } else {
      nconf.set(key, configFile[key]);
    }
  }
}

// Export config
module.exports = nconf;
