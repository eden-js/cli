#!/usr/bin/env node

// Require environment
require('./lib/env');

// Require dependencies
const os      = require('os');
const cluster = require('cluster');
const winston = require('winston');

// Require local dependencies
const log    = require('lib/utilities/log');
const config = require('config');

/**
 * Create App class
 */
class App {
  /**
   * Construct App class
   */
  constructor(opts = {}) {
    // Bind private variables
    this._master = cluster.isMaster;
    this._logger = false;
    this._workers = {};
    this._opts = opts;

    // Bind public methods
    this.run = this.run.bind(this);
    this.exit = this.exit.bind(this);
    this.spawn = this.spawn.bind(this);
    this.logger = this.logger.bind(this);
    this.children = this.children.bind(this);

    // Build logger
    this.logger();

    // Spawn children
    if (this._master) {
      this.children();
    } else {
      this.run();
    }
  }

  /**
   * Runs Eden
   */
  run() {
    // Load eden
    const eden = require('eden'); // eslint-disable-line global-require

    // Log spawning threads
    this._logger.log('info', `Spawned new ${(process.env.express === 'true') ? 'Express' : 'Compute'} thread`, {
      class : 'Eden',
    });

    // Run single Eden instance
    eden.start({
      id      : process.env.id,
      port    : parseInt(process.env.port, 10),
      host    : process.env.host,
      logger  : this._logger,
      express : (process.env.express === 'true'),
    });
  }

  /**
   * On cluster worker exit
   *
   * @param {object} worker
   */
  exit(worker) {
    // Set id
    const { id }  = worker.process.env;
    const express = worker.process.env.express === 'true';

    // Spawn new thread
    this.spawn(parseInt(id, 10), express, (parseInt(config.get('port'), 10) + parseInt(id, 10)));
  }

  /**
   * Spawns new App thread
   *
   * @param {number}  id
   * @param {boolean} express
   * @param {number}  port
   */
  spawn(id, express, port = null) {
    // Clone environment and set thread id
    const env = {
      ...process.env,
      id,
      express : express ? 'true' : 'false',
    };

    // Set if port
    if (port !== null) {
      env.port = port;
    }

    // Fork new thread
    this._workers[`${express ? 'express' : 'compute'}:${id}`] = cluster.fork(env);
    this._workers[`${express ? 'express' : 'compute'}:${id}`].process.env = env;
  }

  /**
   * Builds logger
   */
  logger() {
    // Set logger
    this._logger = winston.createLogger({
      level      : config.get('logLevel') || 'info',
      format     : log,
      transports : [
        new winston.transports.Console(),
      ],
    });
  }

  /**
   * Spawns child processes
   */
  children() {
    // Log running Eden
    this._logger.log('info', 'Running Eden', {
      class : 'Eden',
    });

    // Set process name
    try {
      // Set process name
      process.title = `${config.get('domain')} - master`;
    } catch (e) { /* */ }

    // Check should run express
    if (this._opts.expressThreads !== false) {
      // Get default express threads
      const defaultExpressThreads = [...[...new Array(config.get('expressThreads') !== null ? parseInt(config.get('expressThreads'), 10) : os.cpus().length)].keys()];

      // Get threads from either opts or default
      const expressThreads = this._opts.expressThreads || defaultExpressThreads;

      // Log spawning Express threads
      this._logger.log('info', `spawning express threads ${expressThreads}`, {
        class : 'Eden',
      });

      // Loop threads to launch
      for (const i of expressThreads) {
        this.spawn(i, true, (parseInt(config.get('port'), 10) + i));
      }
    }

    // Check should run compute
    if (this._opts.computeThreads !== false) {
      // Get default compute threads
      const defaultComputeThreads = [...[...new Array(config.get('computeThreads') !== null ? parseInt(config.get('computeThreads'), 10) : os.cpus().length)].keys()];

      // Get threads from either opts or default
      const computeThreads = this._opts.computeThreads || defaultComputeThreads;

      // Log spawning compute threads
      this._logger.log('info', `spawning compute threads ${computeThreads}`, {
        class : 'Eden',
      });

      // Loop threads to launch
      for (const i of computeThreads) {
        this.spawn(i, false);
      }
    }

    // On cluster exit
    cluster.on('exit', this.exit);
  }
}

/**
 * Export Eden App class
 *
 * @type {App}
 */
module.exports = App;
