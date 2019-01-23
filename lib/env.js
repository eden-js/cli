/* eslint-disable import/order, global-require */

// Require dependencies
const Path        = require('path');
const { addPath } = require('app-module-path');
const PrettyError = require('pretty-error');

const loader = require('./loader');

// Set global app root
global.appRoot = Path.resolve(process.cwd());
global.edenRoot = Path.resolve(Path.dirname(__dirname));

const importLocations = loader.getImportLocations([]);

for (const path of importLocations) {
  addPath(path);
}

const config = require('config');

global.importLocations = loader.getImportLocations(config.get('modules') || []);

for (const path of global.importLocations.filter(p => !importLocations.includes(p))) {
  addPath(path);
}

// Keep these here to reduce amount of re-calls to high i/o functions
global.bundlesLocations = loader.getLocations(config.get('modules'), 'bundles');
global.bundleLocations = loader.getLocations(config.get('modules'), 'bundle');

// Require global variables
require('lib/utilities/global');

// Build classes
const prettyError = new PrettyError();

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
