// Require dependencies
const Path        = require('path');
const { addPath } = require('app-module-path');

const loader      = require('./loader');

// Set global app root
global.appRoot = Path.resolve(process.cwd());
global.edenRoot = Path.resolve(Path.dirname(__dirname));

const importLocations = loader.getImportLocations([]);

for (const path of importLocations) {
  addPath(path);
}

const config = require('config'); // eslint-disable-line import/order

global.importLocations = loader.getImportLocations(config.get('modules'));

for (const path of global.importLocations.filter(p => !importLocations.includes(p))) {
  addPath(path);
}

// Keep these here to reduce amount of re-calls to high i/o functions
global.bundlesLocations = loader.getLocations(config.get('modules'), 'bundles');
global.bundleLocations = loader.getLocations(config.get('modules'), 'bundle');

// Require global variables
require('lib/utilities/global');
