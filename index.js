#!/usr/bin/env node

/* eslint no-console: 0 */

// Require dependencies
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
const initEden = require('./lib/utilities/init');

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
   * Init edenjs directory
   */
  async init(dirType = null) {
    const res = await initEden(dirType, this._args.migrateGit);

    if (res !== null) {
      this._logger.log('info', `[${colors.green('init')}] Finished initializing ${res}`);
    } else {
      this._logger.log('error', `[${colors.green('init')}] No existing directory type detected and none supplied`);
    }
  }

  /**
   * starts EdenJS server
   *
   * @return {*}
   */
  start() {
    // set inital express threads
    let expressThreads = null;
    let computeThreads = null;

    // setup globals
    global.isCLI = false;

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
new EdenJS(); // eslint-disable-line no-new
