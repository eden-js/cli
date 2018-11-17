// Require dependencies
const fs          = require('fs-extra');
const Path        = require('path');
const { addPath } = require('app-module-path');

// Set global app root
global.appRoot = Path.dirname(__dirname);

// Add for node_modules
require('app-module-path').enableForDir(`${global.appRoot}/node_modules`);

// Require config
// eslint-disable-next-line global-require, import/no-dynamic-require
const config = require(`${global.appRoot}/app/config`);

/**
 * Create Node alias paths
 *
 * This prevents the need to do require (appRoot + '/lib/core/whatever.js')
 * and instead just do require ('whatever')
 */
addPath(global.appRoot);
addPath(`${global.appRoot}/lib/core`);
addPath(`${global.appRoot}/lib/aliases`);
addPath(`${global.appRoot}/app/bundles/node_modules`);

// Loop for local node_modules
for (const path of (config.modules || [])) {
  // Add node_modules path
  addPath(`${path}/node_modules`);
}

// Add paths from roots
let daemonRoots = [];

if (fs.existsSync(`${global.appRoot}/cache/daemon.roots.json`)) {
  daemonRoots = require(`${global.appRoot}/cache/daemon.roots.json`); // eslint-disable-line global-require, import/no-dynamic-require
}

let controllerRoots = [];

if (fs.existsSync(`${global.appRoot}/cache/controller.roots.json`)) {
  controllerRoots = require(`${global.appRoot}/cache/controller.roots.json`); // eslint-disable-line global-require, import/no-dynamic-require
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
