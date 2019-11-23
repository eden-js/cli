// require dependencies
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Events = require('events');
const yargonaut = require('yargonaut'); // Must precede yargs
const prettyTime = require('pretty-hrtime');
const extractComments = require('extract-comments');

// initialization logic
const env = require('../../lib/env');
const packageJSON = require('../../package.json');

// Set yargs colors
yargonaut
  .style('underline.green')
  .errorsStyle('red');

/**
 * create eden generator class
 *
 * @extends Events
 */
class EdenCore extends Events {
  /**
   * construct eden generator
   */
  constructor() {
    // run super
    // eslint-disable-next-line prefer-rest-params
    super(...arguments);

    // bind base
    this.base = {
      command : this.baseCommand.bind(this),
    };
    this.start = {
      command : this.startCommand.bind(this),
      handler : this.startHandler.bind(this),
    };
    this.run = {
      command : this.runCommand.bind(this),
      handler : this.runHandler.bind(this),
    };
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  //  INIT METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Init logger
   *
   * @param {Yargs} yy
   * @param {Function} logger
   */
  build(yy, logger) {
    // assign logger
    this._logger = logger;

    // add namespaced commands
    return Promise.all(['base', 'start', 'run'].map((namespace) => {
      // return command
      return this[namespace].command(yy);
    }));
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  //  BASE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Base Command function
   *
   * @param {yargs} yy
   */
  baseCommand(yy) {
    // Hashbang must be removed for comment parser to work
    // I know this is stupid but it looks cool at the top of the script too :)
    const extractedComments = extractComments(fs.readFileSync(path.join(global.edenRoot, 'index.js'), 'utf8').split('\n').slice(1).join('\n'));
    const subText = extractedComments[0].raw;
    const logo = extractedComments[1].raw;

    // set process arguments
    const rtn = yy
      .usage(`${chalk.green(logo)}\n${chalk.bold(subText)}\n\nVersion: ${packageJSON.version}\n\nUsage: $0 <command> [options]`)
      .strict()
      .wrap(Math.min(100, yy.terminalWidth()))
      .demandCommand(1)
      .help('help', 'Show usage instructions')
      .alias('help', 'h');

    // return handler
    return {
      usage   : rtn,
      command : '',

      run : () => {},
    };
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  //  START METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Start Command function
   *
   * @param {yargs} yy
   */
  startCommand(yy) {
    // command description
    const command = 'start';
    const description = 'Starts EdenJS in production.';

    // create command
    yy.command(command, description, () => {
      // return yy
      return yy
        .strict(false); // Additional options will be done in lib/aliases/config.js
    });

    // return
    return {
      command,
      description,

      run : this.start.handler,
    };
  }

  /**
   * Start run function
   */
  startHandler() {
    // setup globals
    global.isCLI = false;

    // register
    env.register();

    // require base app
    const App = require(path.join(global.edenRoot, 'app.js')); // eslint-disable-line global-require, import/no-dynamic-require

    // run base app
    new App(); // eslint-disable-line no-new

    // The ride never ends
    return new Promise(() => {});
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  //  RUN METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Start Command function
   *
   * @param {yargs} args
   */
  runCommand(yy) {
    // command description
    const command = 'run [fn]';
    const description = 'Runs EdenJS gulp function.';

    // create command
    yy.command(command, description, () => {
      return yy
        .strict(false) // Additional options will be done in lib/aliases/config.js
        .positional('fn', {
          desc    : 'Gulp function to run',
          default : 'dev',
          type    : 'string',
        });
    });

    // return
    return {
      command,
      description,

      run : this.run.handler,
    };
  }

  /**
   * Run Handler function
   *
   * @param {Object} args
   */
  runHandler(args) {
    // run gulp logic (imports are local here for CLI optimization)
    const gulp = require('gulp'); // eslint-disable-line global-require
    require(path.join(global.edenRoot, 'gulpfile.js')); // eslint-disable-line global-require, import/no-dynamic-require

    // logged errors
    const loggedErrors = [];

    // add start logging
    gulp.on('start', (evt) => {
      this._logger.log(evt.branch ? 'debug' : 'info', `[${chalk.cyan(evt.name)}] Starting`);
    });

    // add stop logging
    gulp.on('stop', (evt) => {
      this._logger.log(evt.branch ? 'debug' : 'info', `[${chalk.cyan(evt.name)}] Finished in ${chalk.magenta(prettyTime(evt.duration))}`);
    });

    // on error
    gulp.on('error', (evt) => {
      this._logger.log(evt.branch ? 'debug' : 'error', `[${chalk.cyan(evt.name)}] Errored after ${chalk.magenta(prettyTime(evt.duration))}`);
      if (!loggedErrors.includes(evt.error)) {
        loggedErrors.push(evt.error);
        global.printError(evt.error);
      }
    });

    // run task
    return new Promise((resolve, reject) => {
      // gulp series
      gulp.series([args.fn === 'dev' ? 'default' : args.fn])((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

// create new eden generator
const edenCore = new EdenCore();

// export module
module.exports = edenCore;
