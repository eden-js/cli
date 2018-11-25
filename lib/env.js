// Require dependencies
const fs          = require('fs-extra');
const Path        = require('path');
const { addPath } = require('app-module-path');

// Set global app root
global.appRoot = Path.resolve(process.cwd());
global.edenRoot = Path.dirname(__dirname);

/**
 * Create Node alias paths
 *
 * This prevents the need to do require (edenRoot + '/lib/core/whatever.js')
 * and instead just do require ('whatever')
 */
addPath(`${global.edenRoot}/node_modules`);

// App modules
addPath(`${global.appRoot}/bundles/node_modules`);
// App modules (legacy)
addPath(`${global.appRoot}/node_modules`);

addPath(`${global.appRoot}/bundles`);
addPath(`${global.appRoot}/data`);

addPath(`${global.edenRoot}/lib/aliases`);
addPath(`${global.edenRoot}/lib/core`);

addPath(global.edenRoot);

// Require config
// eslint-disable-next-line global-require, import/no-dynamic-require
const config = require('config');

// Loop for local node_modules
for (const path of (config.modules || [])) {
  // Add node_modules path
  addPath(`${path}/node_modules`);
  addPath(path);
}

// Add paths from roots
let daemonRoots = [];

if (fs.existsSync(`${global.appRoot}/data/cache/daemon.roots.json`)) {
  daemonRoots = require(`${global.appRoot}/data/cache/daemon.roots.json`); // eslint-disable-line global-require, import/no-dynamic-require
}

let controllerRoots = [];

if (fs.existsSync(`${global.appRoot}/data/cache/controller.roots.json`)) {
  controllerRoots = require(`${global.appRoot}/data/cache/controller.roots.json`); // eslint-disable-line global-require, import/no-dynamic-require
}

// Get roots
const roots = [...daemonRoots, ...controllerRoots].reduce((accum, root) => {
  // Check roots
  if (!accum.includes(root)) accum.push(root);

  // Return accum
  return accum;
}, []);

// Loop roots
for (const root of roots.reverse()) {
  // Add path
  addPath(root);

  // Add aliases path
  addPath(`${root.slice(0, -7)}aliases`);
}

// Require global variables
require('lib/utilities/global');
