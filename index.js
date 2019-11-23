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

// setup globals
global.isCLI = true;

// Require environment
require('./lib/env');

// Require dependencies
const fs               = require('fs-extra');
const glob             = require('@edenjs/glob');
const chalk            = require('chalk');
const yargs            = require('yargs');
const winston          = require('winston');
const { EventEmitter } = require('events');

// Require internal utils
const log    = require('lib/utilities/log');
const loader = require('lib/loader');

/**
 * create eden CLI
 */
class EdenCLI extends EventEmitter {
  /**
   * construct eden CLI
   */
  constructor() {
    // run super
    super();

    // set building promise
    this.building = this.build();
  }

  /**
   * build as async
   */
  async build() {
    // locations
    let locations = [];

    // check tasks
    if (fs.existsSync(`${global.appRoot}/.edenjs/.cache/cli.json`)) {
      // parse
      try {
        locations = JSON.parse(fs.readFileSync(`${global.appRoot}/.edenjs/.cache/cli.json`, 'utf8'));
      } catch (e) {}
    }
    if (!locations.length) {
      // set tasks
      locations = await glob(loader.getFiles('cli/**/*.js', global.bundleLocations));

      // stringify
      fs.writeFile(`${global.appRoot}/.edenjs/.cache/cli.json`, JSON.stringify(locations));
    }

    // set cli commands
    let cliCommands = [];

    // create logger
    const logger = this.logger();

    // glob import locations
    for (const cliPath of locations) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const cliModule = require(cliPath);

      // init
      if (cliModule.build) {
        // push commands from init function
        cliCommands.push(...(await cliModule.build(yargs, logger, this)));
      }
    }

    // Iterate with non-command modules first
    cliCommands = cliCommands.sort((a, b) => {
      // return priorities
      const aP = a.priority || 10;
      const bP = b.priority || 10;

      // return commands
      if (aP > bP) return -1;
      if (bP > aP) return 1;

      return 0;
    });

    // yargs
    const { argv } = yargs;

    // get base command
    const [baseCommandName] = argv._;

    // log running
    this._logger.log('info', `[${chalk.green(baseCommandName)}] Running`);

    // find command
    const command = cliCommands.find(c => (c.command || '').split(' ')[0] === baseCommandName);

    // run command
    try {
      // run command
      await command.run(Object.assign({}, argv));
    } catch (e) {
      global.printError(e);
      process.exit(1);
    }

    // exit
    process.exit(0);
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

    // return logger
    return this._logger;
  }
}

/**
 * export default edenJS
 *
 * @type {EdenJS}
 */
new EdenCLI(); // eslint-disable-line no-new
