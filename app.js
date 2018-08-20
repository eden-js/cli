#!/usr/bin/env node

// Require environment
require('./lib/env');

// Require dependencies
const os       = require('os');
const cluster  = require('cluster');
const winston  = require('winston');
const minimist = require('minimist');

// Require local dependencies
const log    = require('lib/utilities/log');
const config = require('config');

// Set global environment
global.arguments = minimist(process.argv.slice(2));
global.envrionment = process.env.NODE_ENV || config.get('environment');

/**
 * Create App class
 */
class App {

  /**
   * Construct App class
   */
  constructor () {
    // Bind private variables
    this._master  = cluster.isMaster;
    this._logger  = false;
    this._workers = {};

    // Bind public methods
    this.run      = this.run.bind(this);
    this.exit     = this.exit.bind(this);
    this.spawn    = this.spawn.bind(this);
    this.logger   = this.logger.bind(this);
    this.children = this.children.bind(this);

    // Build logger
    this.logger();

    // Spawn children
    this._master ? this.children() : this.run();
  }

  /**
   * Runs Eden
   */
  run () {
    // Load eden
    const eden = require('lib/eden');

    // Log spawning threads
    this._logger.log('info', 'Spawned new ' + ((process.env.express === 'true') ? 'Express' : 'Compute') + ' thread', {
      'class' : 'Eden'
    });

    // Run single Eden instance
    eden.start({
      'id'      : process.env.id,
      'port'    : parseInt(process.env.port),
      'host'    : process.env.host,
      'logger'  : this._logger,
      'express' : (process.env.express === 'true')
    });
  }

  /**
   * On cluster worker exit
   *
   * @param {object} worker
   */
  exit (worker) {
    // Set id
    const id      = worker.process.env.id;
    const express = worker.process.env.express === 'true';

    // Spawn new thread
    this.spawn(parseInt(id), express, (parseInt(config.get('port')) + parseInt(id)));
  }

  /**
   * Spawns new App thread
   *
   * @param {number}  id
   * @param {boolean} express
   * @param {number}  port
   */
  spawn (id, express, port) {
    // Clone environment
    const env = Object.assign({}, process.env);

    // Set thread id
    env.id      = id;
    env.express = express ? 'true' : 'false';

    // Check port
    if (port) env.port = port;

    // Fork new thread
    this._workers[(express ? 'express' : 'compute') + ':' + id] = cluster.fork(env);
    this._workers[(express ? 'express' : 'compute') + ':' + id].process.env = env;
  }

  /**
   * Builds logger
   */
  logger () {
    // Set logger
    this._logger = winston.createLogger({
      'level'      : config.get('logLevel')  || 'info',
      'format'     : log,
      'transports' : [
        new winston.transports.Console()
      ]
    });
  }

  /**
   * Spawns child processes
   */
  children () {
    // Log running Eden
    this._logger.log('info', 'Running Eden', {
      'class' : 'Eden'
    });

    // Set process name
    try {
      // Set process name
      process.title = config.get('domain') + ' - master';
    } catch (e) {}

    // Spawn express threads
    let threads = (global.arguments.threads || '').split(':');

    // Check should run express
    if (!threads[0] || threads[0] === 'express') {
      // Get default express threads
      const defaultExpressThreads = '0-' + ((config.get('expressThreads') || config.get('expressThreads') === 0 ? config.get('expressThreads') : os.cpus().length) - 1);

      // Count frontend express threads
      const expressThreads = (threads[1] ? threads[1].split('-')[0] + '-' + (threads[1].split('-')[1] || threads[1].split('-')[0]) : defaultExpressThreads).split('-').map((thread) => parseInt(thread));

      // Log spawning Express threads
      this._logger.log('info', 'spawning express threads ' + expressThreads[0] + '-' + expressThreads[1], {
        'class' : 'Eden'
      });

      // Loop each express thread
      for (let i = expressThreads[0]; i <= expressThreads[1]; i++) {
        // Spawn new thread
        this.spawn(i, true, (parseInt(config.get('port')) + i));
      }
    }

    // Check should run express
    if (!threads[0] || threads[0] === 'compute') {
      // Get default express threads
      const defaultComputeThreads = '0-' + ((config.get('computeThreads') || config.get('computeThreads') === 0 ? config.get('computeThreads') : os.cpus().length) - 1);

      // Count frontend express threads
      const computeThreads = (threads[1] ? threads[1].split('-')[0] + '-' + (threads[1].split('-')[1] || threads[1].split('-')[0]) : defaultComputeThreads).split('-').map((thread) => parseInt(thread));

      // Log spawning Express threads
      this._logger.log('info', 'spawning compute threads ' + computeThreads[0] + '-' + computeThreads[1], {
        'class' : 'Eden'
      });

      // Loop each express thread
      for (let i = computeThreads[0]; i <= computeThreads[1]; i++) {
        // Spawn new thread
        this.spawn(i, false);
      }
    }

    // On cluster exit
    cluster.on('exit', this.exit);
  }

}

/**
 * Export new Eden App instance
 *
 * @type {App}
 */
module.exports = new App();
