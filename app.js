#!/usr/bin/env node

// Require environment
require('./lib/env');

// Require dependencies
const cluster = require('cluster');
const winston = require('winston');

// Require local dependencies
const log    = require('lib/utilities/log');
const config = require('config');
const pack    = require('./package.json');

/**
 * Create App class
 */
class App {
  /**
   * Construct App class
   */
  constructor() {
    // Bind private variables
    this._master = cluster.isMaster;
    this._logger = false;
    this._workers = {};

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
    this._logger.log('info', `Spawned new "${process.env.cluster}" cluster`, {
      class : 'Eden',
    });

    // Run single Eden instance
    eden.start({
      id      : process.env.id,
      port    : parseInt(process.env.port, 10),
      host    : process.env.host,
      logger  : this._logger,
      cluster : process.env.cluster,
    });
  }

  /**
   * On cluster worker exit
   *
   * @param {object} worker
   */
  exit(worker) {
    // Set id
    const { id } = worker.process.env;
    const { port } = worker.process.env;
    const thread = worker.process.env.cluster;

    // Spawn new thread
    this.spawn(parseInt(id, 10), thread, port);
  }

  /**
   * Spawns new App thread
   *
   * @param {number} id
   * @param {String} label
   * @param {number} port
   */
  spawn(id, label, port = null) {
    // Clone environment and set thread id
    const env = {
      ...process.env,

      id,
      cluster : label,
    };

    // Set if port
    if (port !== null) {
      env.port = port;
    }

    // Fork new thread
    this._workers[`${label}:${id}`] = cluster.fork(env);
    this._workers[`${label}:${id}`].process.env = env;
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
    this._logger.log('info', `running edenJS v.${pack.version}`, {
      class : 'Eden',
    });

    // Set process name
    try {
      // Set process name
      process.title = `edenjs v.${pack.version} - ${config.get('domain')} - master`;
    } catch (e) { /* */ }

    // spawn threads
    (config.get('clusters') || ['front', 'back']).forEach((label) => {
      // check count
      for (let i = 0; i < (config.get('count') || 1); i += 1) {
        this.spawn(i, label, (config.get('router') || label === 'front') ? (parseInt(config.get('port'), 10) + i) : null);
      }
    });

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
