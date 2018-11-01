// Require dependencies
const fs      = require('fs-extra');
const path    = require('path');
const addPath = require('app-module-path').addPath;

// Set global app root
global.appRoot = path.dirname(__dirname);

/**
 * Create Node alias paths
 *
 * This prevents the need to do require (appRoot + '/lib/core/whatever.js') and instead just do require ('whatever')
 */
addPath(global.appRoot);
addPath(global.appRoot + '/lib/core');
addPath(global.appRoot + '/lib/bundles');
addPath(global.appRoot + '/lib/aliases');
addPath(global.appRoot + '/app/bundles/node_modules');

// Add paths from roots
let daemonRoots = fs.existsSync(global.appRoot + '/cache/daemon.roots.json') ? require(global.appRoot + '/cache/daemon.roots.json') : [];
let controllerRoots = fs.existsSync(global.appRoot + '/cache/controller.roots.json') ? require(global.appRoot + '/cache/controller.roots.json') : [];

// Loop roots
for (let root of daemonRoots) {
  // Add path
  addPath(root);
}
for (let root of controllerRoots) {
  // Add path
  addPath(root);
}

// Require global variables
require('lib/utilities/global');
