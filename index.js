#!/usr/bin/env node

/* eslint no-console: 0 */

// Require dependencies
const fs = require('fs-extra');
const path = require('path');
const glob = require('globby');
const gulp = require('gulp');
const colors = require('colors');
const Events = require('events');
const winston = require('winston');
const minimist = require('minimist');
const cliUsage = require('command-line-usage');
const prettyTime = require('pretty-hrtime');
const PrettyError = require('pretty-error');

// require config files
const log = require('./lib/utilities/log');
const usage = require('./lib/usage');

// setup globals
global.isCLI = true;

/**
 * create events class
 *
 * @extends events
 */
class EdenJS extends Events {
  /**
   * construct EdenJS
   */
  constructor(...args) {
    // run super
    super(...args);

    // set process arguments
    this._args = minimist(process.argv.slice(2));

    // create logger
    this.logger();

    // get function
    const fn = this._args._.shift();

    // check function exists
    if (fn && this[fn]) {
      // log
      this._logger.log('info', `[${colors.green(fn)}] Running`);

      // run actual function with subsequent args
      this[fn](...this._args._);
    } else {
      // run help
      this.help();
    }
  }

  /**
   * returns edenjs help
   */
  help() {
    // create usage
    const usageText = cliUsage(usage);

    // log usage
    console.log(usageText);
  }

  /**
   * starts EdenJS server
   *
   * @return {*}
   */
  start() {
    //
    let expressThreads = null;
    let computeThreads = null;

    // check express threads
    if (this._args.expressThreads) {
      if (this._args.expressThreads === '-1') {
        expressThreads = false;
      } else {
        expressThreads = this._range(...this._args.expressThreads.split('-').map(ns => parseInt(ns, 10)));
      }
    }

    // check compute threads
    if (this._args.computeThreads) {
      if (this._args.computeThreads === '-1') {
        computeThreads = false;
      } else {
        computeThreads = this._range(...this._args.computeThreads.split('-').map(ns => parseInt(ns, 10)));
      }
    }

    // require base app
    const App = require('./app.js'); // eslint-disable-line global-require

    // run base app
    new App({ // eslint-disable-line no-new
      expressThreads,
      computeThreads,
    });
  }

  /**
   * runs gulp function
   *
   * @param  {String} fn
   *
   * @return {*}
   */
  run(fn) {
    // run gulp logic
    require('./gulpfile.js'); // eslint-disable-line global-require

    // create pretty error
    const prettyError = new PrettyError();

    // add start logging
    gulp.on('start', (evt) => {
      // so when 5 tasks start at once it only logs one time with all 5
      const level = evt.branch ? 'debug' : 'info';

      // log
      this._logger.log(level, `[${colors.cyan(evt.name)}] Starting`);
    });

    // add stop logging
    gulp.on('stop', (evt) => {
      // set time
      const time = prettyTime(evt.duration);

      // so when 5 tasks start at once it only logs one time with all 5
      const level = evt.branch ? 'debug' : 'info';

      // log
      this._logger.log(level, `[${colors.cyan(evt.name)}] Finished in ${colors.magenta(time)}`);
    });

    // on error
    gulp.on('error', (evt) => {
      // format error
      const err = prettyError.render(evt.error || evt.message);

      // set time
      const time = prettyTime(evt.duration);

      // so when 5 tasks start at once it only logs one time with all 5
      const level = evt.branch ? 'debug' : 'info';

      // log
      this._logger.log(level, `[${colors.cyan(evt.name)}] Errored after ${colors.magenta(time)}`);

      // log error
      console.log(err);
    });

    // run task
    gulp.task(fn || 'default')();
  }

  /**
   * Builds logger
   */
  logger() {
    // Set logger
    this._logger = winston.createLogger({
      level      : 'info',
      format     : log,
      transports : [
        new winston.transports.Console(),
      ],
    });
  }

  /**
   * returns range
   *
   * @param  {Integer} bottom
   * @param  {Integer} top
   *
   * @return {Array}
   */
  _range(bottom, top) {
    // return array range
    return [...[...new Array((top - bottom) + 1)].keys()].map(n => n + bottom);
  }
}

/**
 * export default edenJS
 *
 * @type {EdenJS}
 */
exports = module.exports = new EdenJS();

// @todo migrate this correctly

const commonBadFiles = [
  '.npmignore',
  'yarn.lock',
  'node_modules',
  'npm-debug.log',
  'yarn-error.log',
  '.idea',
  '.remote-sync.json',
  '.editorconfig',
  '.eslintrc.json',
  '.htaccess',
];

async function edenExistsIn(dir) {
  try {
    const olderBundlesPath = path.join(dir, 'app', 'bundles');

    if (await fs.pathExists(olderBundlesPath)) {
      return 'oldApp';
    }

    const configPath = path.join(dir, 'config.js');

    if (await fs.pathExists(configPath)) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const configFile = require(configPath);

      // Make sure its edenjs-like first
      if (typeof configFile === 'object' && typeof configFile.domain === 'string' && typeof configFile.version === 'string') {
        return 'app';
      }
    }

    const rootJsPaths = await glob('./*.js');

    const bundlesPath = path.join(dir, 'bundles');

    if (await fs.pathExists(bundlesPath)) {
      if (rootJsPaths.length === 0) {
        return 'module';
      } if (rootJsPaths.length === 1 && rootJsPaths[0] === 'index.js') {
        const indexText = await fs.readFile(path.join(dir, 'index.js'), 'utf8');

        if (indexText.match(/^\/\/ EdenJS module does not require an index$/m)) {
          return 'module';
        }
      }
    }

    const edenStructuredFiles = await glob('./*/{controllers,models,views,daemons,helpers}/*.js');

    if (edenStructuredFiles.length > 3) {
      return 'oldAppBundles';
    }
  } catch (err) {}

  return 'none';
}

async function initEden(suppliedDirType = null, migrateGit = false) {
  let dirType = await edenExistsIn(process.cwd());

  // If no type manually specified, and nothing existing found, do nothing
  if (suppliedDirType === null && dirType === 'none') {
    return;
  }

  const shouldMakeIntoApp = (suppliedDirType === null && (dirType === 'app' || dirType === 'oldApp' || dirType === 'oldAppBundles')) || suppliedDirType === 'app';
  const shouldMakeIntoModule = (suppliedDirType === null && dirType === 'module') || suppliedDirType === 'module';

  let hasConfig = false;

  // oldApp => app
  if (dirType === 'oldApp' && shouldMakeIntoApp) {
    // Move config and bundles to correct place
    await fs.copy(path.join(process.cwd(), 'app', 'bundles'), path.join(process.cwd(), 'bundles'));

    if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'app', 'config.js'))) {
      await fs.copy(path.join(process.cwd(), 'app', 'config.js'), path.join(process.cwd(), 'config.js'));
      hasConfig = true;
    }

    // Remove edenjs install and junk
    await Promise.all([
      fs.remove(path.join(process.cwd(), 'CONTRIBUTING.md')),
      fs.remove(path.join(process.cwd(), 'LICENSE')),
      fs.remove(path.join(process.cwd(), 'README.md')),
      fs.remove(path.join(process.cwd(), 'TUTORIAL.md')),
      fs.remove(path.join(process.cwd(), 'app.js')),
      fs.remove(path.join(process.cwd(), 'gulpfile.js')),
      fs.remove(path.join(process.cwd(), 'lib')),
      fs.remove(path.join(process.cwd(), 'tests')),
      fs.remove(path.join(process.cwd(), 'package.json')),
      fs.remove(path.join(process.cwd(), 'package-lock.json')),
      fs.remove(path.join(process.cwd(), 'www')),
      fs.remove(path.join(process.cwd(), 'app')),
      fs.remove(path.join(process.cwd(), '.git')),
      fs.remove(path.join(process.cwd(), '.gitignore')),
      fs.remove(path.join(process.cwd(), '.gitattributes')),

      ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), file))),
    ]);

    dirType = 'app';
  }

  // oldAppBundles => app
  if (dirType === 'oldAppBundles' && shouldMakeIntoApp) {
    const paths = await glob(['./*'], {
      onlyFiles : false,
    });

    await fs.ensureDir(path.join(process.cwd(), 'bundles'));

    for (const p of paths) {
      await fs.move(path.join(process.cwd(), p), path.join(process.cwd(), 'bundles', p));
    }

    dirType = 'app';
  }

  // Remove common junk
  await Promise.all([
    ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), file))),
  ]);

  // Make sure data directory is clean
  if (!shouldMakeIntoModule) {
    await fs.ensureDir(path.join(process.cwd(), 'data'));
  }

  if (dirType === 'module' || dirType === 'app') {
    // Remove junk files in bundles/
    await Promise.all([
      fs.remove(path.join(process.cwd(), 'bundles', 'package.json')),
      ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), 'bundles', file))),
    ]);
  }

  // Put standard edenjs files into place
  await fs.copy(path.join(__dirname, '.eslintrc.json'), path.join(process.cwd(), '.eslintrc.json'));
  await fs.copy(path.join(__dirname, '.editorconfig'), path.join(process.cwd(), '.editorconfig'));

  // Put standard edenjs files into place if they dont exist
  if (!(await fs.pathExists(path.join(process.cwd(), '.gitignore')))) {
    await fs.copy(path.join(__dirname, '.gitignore_screwnpm'), path.join(process.cwd(), '.gitignore'));
  }

  if (!(await fs.pathExists(path.join(process.cwd(), '.gitattributes')))) {
    await fs.copy(path.join(__dirname, '.gitattributes'), path.join(process.cwd(), '.gitattributes'));
  }

  if (shouldMakeIntoApp && !hasConfig && !(await fs.pathExists(path.join(process.cwd(), 'config.js')))) {
    await fs.copy(path.join(__dirname, 'config.example.js'), path.join(process.cwd(), 'config.js'));
  }

  // Add to or create package.json
  let packageData = null;

  if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'bundles', 'package.json'))) {
    packageData = await fs.readJSON(path.join(process.cwd(), 'bundles', 'package.json'));
    await fs.remove(path.join(process.cwd(), 'bundles', 'package.json'));
  } else if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'package.json'))) {
    // Read existing package data
    packageData = await fs.readJSON(path.join(process.cwd(), 'package.json'));
  } else {
    // Default package data
    packageData = {
      name        : path.basename(process.cwd()),
      description : 'nothing yet',
      version     : '1.0.0',
      engines     : {
        node : '>= 8.0.0',
      },
    };
  }

  // Add our dev dependencies for eslint
  packageData.devDependencies = Object.assign({}, packageData.devDependencies, {
    '@edenjs/eslint-config-eden' : '^2.0.14',
    eslint                       : '^5.10.0',
    'eslint-config-airbnb'       : '^17.1.0',
    'eslint-plugin-import'       : '^2.14.0',
    'eslint-plugin-jsx-a11y'     : '^6.1.2',
    'eslint-plugin-react'        : '^7.11.1',
  });

  // Save new package data
  await fs.writeJSON(path.join(process.cwd(), 'package.json'), packageData, {
    spaces : 2,
  });

  // Migrate .git from bundles to cwd if requested
  if (migrateGit && dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'bundles', '.git')) && !(await fs.pathExists(path.join(process.cwd(), '.git')))) {
    await fs.move(path.join(process.cwd(), 'bundles', '.git'), path.join(process.cwd(), '.git'));
  }
}
