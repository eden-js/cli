#!/usr/bin/env node

/*
  Awesome isomorphic NodeJS skeleton for structured applications.
  Just have a look at the "bundles" that make up an EdenJS application.
*/

/*
  ███████╗██████╗ ███████╗███╗   ██╗     ██╗███████╗
  ██╔════╝██╔══██╗██╔════╝████╗  ██║     ██║██╔════╝
  █████╗  ██║  ██║█████╗  ██╔██╗ ██║     ██║███████╗
  ██╔══╝  ██║  ██║██╔══╝  ██║╚██╗██║██   ██║╚════██║
  ███████╗██████╔╝███████╗██║ ╚████║╚█████╔╝███████║
  ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚════╝ ╚══════╝
*/

// Require environment
require('./lib/env');

// Require dependencies
const gulp             = require('gulp');
const chalk            = require('chalk');
const { EventEmitter } = require('events');
const winston          = require('winston');
const prettyTime       = require('pretty-hrtime');
const PrettyError      = require('pretty-error');
const glob             = require('@edenjs/glob');
const yargs            = require('yargs');

// Require internal utils
const loader = require('lib/loader');
const log = require('lib/utilities/log');
const initEden = require('lib/utilities/init');

// setup globals
global.isCLI = true;

class EdenCLI extends EventEmitter {
  constructor() {
    // run super
    super();

    this.building = this.build();
  }

  async build() {
    const cliLocations = loader.getFiles(global.bundleLocations, 'cli/**/*.js');
    const cliCommands = [];

    for (const cliPath of await glob(cliLocations)) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const cliModuleCommands = require(cliPath);

      cliCommands.push(...cliModuleCommands);
    }

    let yy = yargs;

    for (const command of cliCommands) {
      if (command.command === null) {
        yy = command.fn(yy);
        continue;
      }

      yy = yy.command(command.command, command.description, command.fn);
    }

    this._args = yy.argv;

    // create logger
    this.logger();

    // get function
    const [command] = this._args._;

    this._logger.log('info', `[${chalk.green(command)}] Running`);

    if (command === 'start') {
      this.start();
    } else if (command === 'run') {
      this.run();
    } else if (command === 'init') {
      this.init();
    }
  }

  /**
   * Init edenjs directory
   */
  async init() {
    const res = await initEden(this._args.dirType, this._args.migrateGit);

    if (res !== null) {
      this._logger.log('info', `[${chalk.green('init')}] Finished initializing ${res}`);
    } else {
      this._logger.log('error', `[${chalk.green('init')}] No existing directory type detected and none supplied`);
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
  run() {
    // run gulp logic
    require('./gulpfile.js'); // eslint-disable-line global-require

    // create pretty error
    const prettyError = new PrettyError();

    // add start logging
    gulp.on('start', (evt) => {
      // so when 5 tasks start at once it only logs one time with all 5
      const level = evt.branch ? 'debug' : 'info';

      // log
      this._logger.log(level, `[${chalk.cyan(evt.name)}] Starting`);
    });

    // add stop logging
    gulp.on('stop', (evt) => {
      // set time
      const time = prettyTime(evt.duration);

      // so when 5 tasks start at once it only logs one time with all 5
      const level = evt.branch ? 'debug' : 'info';

      // log
      this._logger.log(level, `[${chalk.cyan(evt.name)}] Finished in ${chalk.magenta(time)}`);
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
      this._logger.log(level, `[${chalk.cyan(evt.name)}] Errored after ${chalk.magenta(time)}`);

      // log error
      console.error(err); // eslint-disable-line no-console
    });

    // run task
    gulp.task(this._args.fn === 'install' ? 'install' : 'default')();
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
new EdenCLI(); // eslint-disable-line no-new
