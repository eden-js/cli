// Require dependencies
const fs          = require('fs-extra');
const Path        = require('path');
const { addPath } = require('app-module-path');
const PrettyError = require('pretty-error');

/**
 * eden environment
 */
class EdenEnvironment {
  /**
   * construct eden environment
   */
  constructor() {
    // Set global app root
    global.appRoot = Path.resolve(process.cwd());
    global.edenRoot = Path.resolve(Path.dirname(__dirname));

    // babel cache path
    process.env.BABEL_CACHE_PATH = `${global.appRoot}/.edenjs/.cache/babel-backend.json`;

    // set cache file
    this._cacheFile = `${global.appRoot}/.edenjs/.cache/env.json`;

    // babel register sync
    if (!global.isCLI) this.register();

    // build imports sync
    this.imports();

    // build globals sync
    this.globals();

    // build errors
    this.errors();
  }

  /**
   * register babel for ts imports
   */
  register() {
    // check registered
    if (this.registered) return;

    // registered
    this.registered = true;

    // require inline register
    // eslint-disable-next-line global-require
    const register = require('@babel/register');

    // run babel register
    register({
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
  }

  /**
   * build
   */
  imports() {
    // required after ts register
    const loader = require('./loader');

    // create envionment cache
    const cached = {};
    let shouldCache = false;

    // local imports
    const local = cached.local || loader.getImports();

    // check locations
    if (!cached.local) {
      shouldCache = true;
      cached.local = local;
    }

    // add path for local imports
    for (const path of local) {
      addPath(path);
    }

    // require config
    // required later than the above
    const config = require('config');

    // import locations
    global.importLocations = cached.modules || loader.getImports(config.get('modules') || []);

    // check locations
    if (!cached.modules) {
      shouldCache = true;
      cached.modules = global.importLocations;
    }

    // add paths
    for (const path of global.importLocations.filter(p => !local.includes(p))) {
      addPath(path);
    }

    // Keep these here to reduce amount of re-calls to high i/o functions
    global.bundlesLocations = cached.bundles || loader.getLocations(config.get('modules'), 'bundles');
    global.bundleLocations = cached.bundle || loader.getLocations(config.get('modules'), 'bundle');

    // locations
    if (!cached.bundle || !cached.bundles) {
      shouldCache = true;
      cached.bundle = global.bundleLocations;
      cached.bundles = global.bundlesLocations;
    }

    // should write
    if (shouldCache) {
      // write cache
      fs.writeFile(this._cacheFile, JSON.stringify(cached));
    }
  }

  /**
   * builds globals
   */
  globals() {
    // Require global variables
    require('lib/utilities/global');
  }

  /**
   * builds errors
   */
  errors() {
    // Build classes
    const prettyError = new PrettyError();

    // print error global
    global.printError = (e) => {
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
  }
}

// setup environment
module.exports = new EdenEnvironment();
