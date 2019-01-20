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
const chalk            = require('chalk');
const { EventEmitter } = require('events');
const winston          = require('winston');
const glob             = require('@edenjs/glob');
const yargs            = require('yargs');

// Require internal utils
const loader = require('lib/loader');
const log = require('lib/utilities/log');

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

    // Iterate with non-command modules first
    const sortedCommands = cliCommands.sort((a, b) => {
      return (a.command === null && b.command !== null ? -1 : 1);
    });

    for (const command of sortedCommands) {
      if (command.command === null) {
        yy = command.fn(yy);
      } else {
        yy = yy.command(command.command, command.description, command.fn.bind(this));
      }
    }

    this._args = yy.argv;

    // create logger
    this.logger();

    // get function
    const [command] = this._args._;

    this._logger.log('info', `[${chalk.green(command)}] Running`);

    cliCommands.find(c => (c.command || '').split(' ')[0] === command).handler.bind(this)();
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
}

/**
 * export default edenJS
 *
 * @type {EdenJS}
 */
new EdenCLI(); // eslint-disable-line no-new
