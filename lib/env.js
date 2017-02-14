
// require dependencies
const path    = require ('path');
const addPath = require ('app-module-path').addPath;

// set global app root
global.appRoot = path.dirname (__dirname);

// add node paths
addPath (global.appRoot);
addPath (global.appRoot + '/lib/core');
addPath (global.appRoot + '/app/bundles');
addPath (global.appRoot + '/lib/bundles');
addPath (global.appRoot + '/lib/aliases');
