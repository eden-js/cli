// Require dependencies
import fs from 'fs-extra';

import glob from '@edenjs/glob';
import nconf from 'nconf';
import deepMerge from 'deepmerge';

// Require local dependencies
import loader from '../loader';

import getBaseConfig from '../baseconfig';

// main config file
let mainConfigFile = null;

// main config file
if (fs.existsSync(`${global.appRoot}/config.js`)) {
  mainConfigFile = require(`${global.appRoot}/config`); // eslint-disable-line import/no-dynamic-require, global-require
} else if (fs.existsSync(`${global.appRoot}/edenappconfig.js`)) {
  // This should be deprecated
  mainConfigFile = require(`${global.appRoot}/edenappconfig`); // eslint-disable-line import/no-dynamic-require, global-require
}

// Use memory store
nconf.use('memory', {
  logicalSeparator : '.',
});

// Add arguments
nconf.argv({
  // WTF?? why isnt it per key
  parseValues : true,
  transform   : (obj) => {
    if (obj.key === 'clusters' && typeof obj.value === 'string') obj.value = obj.value.split(',');
    return obj;
  },

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
  clusters : {
    alias       : 'C',
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
  transform        : ({ key, value }) => ({
    key   : key.toLowerCase().replace(/_([a-z])/g, g => g[1].toUpperCase()),
    value : value
  }),
});

// main config file
if (mainConfigFile !== null) {
  // Add file config
  nconf.add('supplied', {
    type             : 'literal',
    store            : mainConfigFile,
    logicalSeparator : '.',
  });
}

// get files
const configLocations = loader.getFiles('edenconfig.js', loader.getLocations(nconf.get('modules') || [], 'root')).reverse();

// loop configuration files
for (const configPath of glob.sync(configLocations)) {
  // require config file
  const configFile = require(`${configPath}`); // eslint-disable-line import/no-dynamic-require, global-require

  // check key
  for (const key of Object.keys(configFile)) {
    // check if modules
    if (key === 'modules') {
      continue; // This is bad practice, and would require a recursive config builder
    }

    // This is unfortunate, nconf should have merging support built in
    const existing = nconf.get(key);
    if (existing !== undefined) {
      nconf.set(key, deepMerge(configFile[key], existing));
    } else {
      nconf.set(key, configFile[key]);
    }
  }
}

// Load default config
nconf.defaults(getBaseConfig(nconf));

// Export config
export default nconf;
