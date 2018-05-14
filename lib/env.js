// Require dependencies
const path    = require ('path');
const addPath = require ('app-module-path').addPath;

// Set global app root
global.appRoot = path.dirname (__dirname);

// Create node alias paths
//
// This prevents the need to do require (appRoot + '/lib/core/whatever.js') and instead just do require ('whatever')
//
addPath (global.appRoot);
addPath (global.appRoot + '/lib/core');
addPath (global.appRoot + '/app/bundles');
addPath (global.appRoot + '/lib/bundles');
addPath (global.appRoot + '/lib/aliases');
addPath (global.appRoot + '/app/bundles/node_modules');

// Require global variables
require ('lib/utilities/global');
