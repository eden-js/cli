// Require dependencies
const fs          = require('fs-extra');
const Path        = require('path');
const process     = require('process');
const { addPath } = require('app-module-path');

/**
 * eden environment
 */
class EdenEnv {
  /**
   * construct eden environment
   */
  constructor() {
    // Set global app root
    global.appRoot = Path.resolve(process.cwd());
    global.edenRoot = Path.resolve(Path.dirname(__dirname));

    // babel cache path
    process.env.BABEL_CACHE_PATH = `${global.appRoot}/.edenjs/.cache/babel-backend.json`;

    // babel register sync
    this.register();

    // build helpers
    if (!global.CLI) {
      // globals
      this.aliases();

      // globals
      this.globals();
    }
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
          // return don't ignore
          return !filePath.includes('.ts') && !filePath.includes('.edenjs') && !filePath.includes('/i18n');
        },
      ],
      plugins : [
        '@babel/plugin-transform-runtime',
        ['@babel/plugin-transform-typescript', {
          strictMode : false,
        }],
        'add-module-exports',
      ],
      extensions : ['.ts', '.js'],
    });
  }

  /**
   * builds errors
   */
  aliases() {
    // log bundles
    const bases = Array.from(new Set(global.bundles.map((b) => `${b.path.split('/bundles')[0]}`).reduce((accum, path) => {
      // aliases
      accum.push(`${path}/bundles`);
      accum.push(`${path}/aliases`);
      accum.push(`${path}/node_modules`);

      // return accumulator
      return accum;
    }, [])));

    // app/eden
    bases.push(global.appRoot);
    bases.push(`${global.appRoot}/aliases`);
    bases.push(`${global.appRoot}/node_modules`);
    bases.push(global.edenRoot);
    bases.push(`${global.edenRoot}/aliases`);
    bases.push(`${global.edenRoot}/node_modules`);

    // add paths
    bases.filter((base) => fs.existsSync(base)).forEach((base) => addPath(base));
  }

  /**
   * builds errors
   */
  globals() {
    // cache function
    global.cache = (name, d) => {
      // return global
      return global[name] || d;
    };

    // model function
    global.model = (name) => {
      // name
      name = name.split('/').pop().toLowerCase();

      // mod
      const mod = (global.models || {})[name] ? (global.models || {})[name]() : null;

      // return global
      return mod ? (mod.default || mod) : null;
    };

    // helper function
    global.helper = (name) => {
      // Set helper name
      const fmtName = `${name.split('/')[0]}/helpers/${name.split('/')[name.split('/').length - 1]}`;

      // return helper
      return (global.helpers || {})[fmtName] ? (global.helpers || {})[fmtName]() : null;
    };
  }
}

// setup environment
global.edenENV = new EdenEnv();
