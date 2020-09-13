#!/usr/bin/env node

/* eslint-disable global-require */

// require dependencies
const { argv } = require('yargs');

// require spawn
if (argv._[0] === 'spawn') {
  require('./spawn');
} else {
  require('./app');
}
