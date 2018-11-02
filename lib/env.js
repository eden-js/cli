// Require dependencies
const fs      = require('fs-extra');
const path    = require('path');
const addPath = require('app-module-path').addPath;

// Set global app root
global.appRoot = path.dirname(__dirname);

// Add for node_modules
require('app-module-path').enableForDir(global.appRoot + '/node_modules');

/**
 * Create Node alias paths
 *
 * This prevents the need to do require (appRoot + '/lib/core/whatever.js') and instead just do require ('whatever')
 */
addPath(global.appRoot);
addPath(global.appRoot + '/lib/core');
addPath(global.appRoot + '/lib/aliases');
addPath(global.appRoot + '/app/bundles/node_modules');

// Add paths from roots
let daemonRoots = fs.existsSync(global.appRoot + '/cache/daemon.roots.json') ? require(global.appRoot + '/cache/daemon.roots.json') : [];
let controllerRoots = fs.existsSync(global.appRoot + '/cache/controller.roots.json') ? require(global.appRoot + '/cache/controller.roots.json') : [];

// Get roots
let roots = [...daemonRoots, ...controllerRoots].reduce((accum, root) => {
  // Check roots
  if (!accum.includes(root)) accum.push(root);

  // Return accum
  return accum
}, []);

// Loop roots
for (let root of roots.reverse()) {
  // Add path
  addPath(root);

  // Add aliases path
  addPath(root.slice(0, -7) + 'aliases');
}

// Require global variables
require('lib/utilities/global');
