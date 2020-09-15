#!/usr/bin/env node

// false
global.CLI = true;

// Require dependencies
const fs = require('fs-extra');
const cluster = require('cluster');
const winston = require('winston');
const { argv } = require('yargs');

// Require local dependencies
// eslint-disable-next-line import/no-dynamic-require
const log = require(`${__dirname}/lib/log`);

/**
 * Create App class
 */
class App {
  /**
   * Construct App class
   */
  constructor() {
    // Bind private variables
    this.master = cluster.isMaster;
    this.logger = false;
    this.workers = {};

    // get cluster
    if (!this.master) {
      // require file
      if (fs.existsSync(`${process.cwd()}/.edenjs/cluster.${process.env.EDEN_CLUSTER}.js`)) {
        // require file
      // eslint-disable-next-line global-require,import/no-dynamic-require
        require(`${process.cwd()}/.edenjs/cluster.${process.env.EDEN_CLUSTER}.js`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`${process.cwd()}/.edenjs/cluster.${process.env.EDEN_CLUSTER}.js NOT FOUND`);
      }

      // return
      return;
    }

    // Bind public methods
    this.exit = this.exit.bind(this);
    this.spawn = this.spawn.bind(this);
    this.buildLogger = this.buildLogger.bind(this);

    // Build logger
    this.buildLogger();

    // check cluster
    let clusters = ['front', 'back'];

    // check cluster
    if (process.env.CLUSTER) {
      // split by env
      clusters = process.env.CLUSTER.split(',');
    }
    if (argv.cluster) {
      // cluster
      clusters = argv.cluster.split(',');
    }

    // launch clusters
    clusters.forEach((c) => {
      // launch
      this.spawn(c);
    });

    // On cluster exit
    cluster.on('exit', this.exit);
  }

  /**
   * On cluster worker exit
   *
   * @param {object} worker
   */
  exit(worker) {
    // Spawn new thread
    this.spawn(worker.process.env.EDEN_CLUSTER);
  }

  /**
   * Spawns new App thread
   *
   * @param {number} id
   * @param {String} label
   * @param {number} port
   */
  spawn(c) {
    // args
    const args = { ...argv, ...process.env };

    // remove cluster
    delete args.cluster;

    // Clone environment and set thread id
    const env = {
      ...args,

      EDEN_CLUSTER : c,
    };

    // Fork new thread
    this.workers[c] = cluster.fork(env);
    this.workers[c].process.env = env;
  }

  /**
   * Builds logger
   */
  buildLogger() {
    // Set logger
    this.logger = winston.createLogger({
      level      : 'info',
      format     : log,
      transports : [
        new winston.transports.Console(),
      ],
    });
  }
}

/**
 * Export Eden App class
 *
 * @type {App}
 */
module.exports = new App();
