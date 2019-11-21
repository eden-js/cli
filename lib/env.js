/* eslint-disable import/order, global-require */

// Require dependencies
const Path        = require('path');
const { addPath } = require('app-module-path');
const PrettyError = require('pretty-error');

// Set global app root
global.appRoot = Path.resolve(process.cwd());
global.edenRoot = Path.resolve(Path.dirname(__dirname));

// babel register
process.env.BABEL_CACHE_PATH = `${global.appRoot}/.cache/babel-backend.json`;
require('@babel/register')({
  cache   : true,
  presets : [
    ['@babel/preset-env', {
      targets : {
        node : 'current',
      },
    }],
  ],
  ignore : [
    // ignore
    (filePath) => {
      return (!filePath.includes('/bundles/') && !filePath.includes('.edenjs') && !filePath.includes(Path.resolve(`${global.edenRoot}`))) || (filePath.includes('node_modules') && !filePath.includes('/bundles/'));
    },
  ],
  plugins : [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-typescript',
    'add-module-exports',
  ],
  extensions : ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts'],
});

// loader
const loader = require('./loader');


// base imports
const localImportLocations = loader.getImports();

// paths
for (const path of localImportLocations) {
  addPath(path);
}

// require config
const config = require('config');

// import locations
global.importLocations = loader.getImports(config.get('modules') || []);

// add paths
for (const path of global.importLocations.filter(p => !localImportLocations.includes(p))) {
  addPath(path);
}

// Keep these here to reduce amount of re-calls to high i/o functions
global.bundlesLocations = loader.getLocations(config.get('modules'), 'bundles');
global.bundleLocations = loader.getLocations(config.get('modules'), 'bundle');

// Require global variables
require('lib/utilities/global');

// Build classes
const prettyError = new PrettyError();

// print error global
global.printError = function printError(e) {
  console.error(prettyError.render(e)); // eslint-disable-line no-console
};

// Build unhandled rejection error handler
process.on('unhandledRejection', (e) => {
  // Log error
  global.printError(e);
});

// Build uncaught exception error handler
process.on('uncaughtException', (e) => {
  // Log error
  global.printError(e);
});
