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

// Require dependencies
const gulp             = require('gulp');
const chalk            = require('chalk');
const yargonaut        = require('yargonaut'); // Must precede yargs
const yargs            = require('yargs');
const { EventEmitter } = require('events');
const winston          = require('winston');
const prettyTime       = require('pretty-hrtime');
const PrettyError      = require('pretty-error');
const extractComments  = require('extract-comments');
const fs               = require('fs-extra');

// require config files
const log = require('./lib/utilities/log');
const initEden = require('./lib/utilities/init');

// setup globals
global.isCLI = true;

// Set yargs colors
yargonaut
  .style('underline.green')
  .errorsStyle('red');

/* eslint no-console: 0 */

class EdenCLI extends EventEmitter {
  constructor(...args) {
    // run super
    super(...args);

    // Hashbang must be removed for comment parser to work
    // I know this is stupid but it looks cool at the top of this script too :)
    const extractedComments = extractComments(fs.readFileSync(__filename, 'utf8').split('\n').slice(1).join('\n'));
    const subText = extractedComments[0].raw;
    const logo = extractedComments[1].raw;

    // set process arguments
    this._args = yargs
      .usage(`${chalk.green(logo)}\n${chalk.bold(subText)}\n\nUsage: $0 <command> [options]`)
      .strict()
      .wrap(Math.min(100, yargs.terminalWidth()))
      .command('start', 'Starts EdenJS in production.', () => {
        return yargs
          .strict(false); // Additional options will be done in lib/aliases/config.js
      })
      .command('run [fn]', 'Runs EdenJS gulp function.', () => {
        return yargs
          .strict(false) // Additional options will be done in lib/aliases/config.js
          .positional('fn', {
            desc    : 'Gulp function to run',
            default : 'dev',
            type    : 'string',
          })
          .choices('fn', ['dev', 'install']);
      })
      .command('init <dirType>', 'Initialize new or fix existing EdenJS directory.', () => {
        return yargs
          .positional('dirType', {
            desc : 'EdenJS directory type',
            type : 'string',
          })
          .choices('dirType', ['app', 'module'])
          .option('migrateGit', {
            alias    : 'g',
            describe : 'Migrate .git directory if misplaced in current directory',
          });
      })
      .demandCommand(1)
      .help('help', 'Show usage instructions')
      .alias('help', 'h')
      .argv;

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
      console.log(err);
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
