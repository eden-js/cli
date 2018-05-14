#!/usr/bin/env node

// Require environment
require ('./lib/env');

// Require dependencies
const os      = require ('os');
const cluster = require ('cluster');
const winston = require ('winston');

// Require local dependencies
const log    = require ('lib/utilities/log');
const config = require ('config');

// Set global environment
global.envrionment = process.env.NODE_ENV || config.get ('environment');

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
    this.run      = this.run.bind (this);
    this.exit     = this.exit.bind (this);
    this.spawn    = this.spawn.bind (this);
    this.logger   = this.logger.bind (this);
    this.children = this.children.bind (this);

    // Build logger
    this.logger ();

    // Spawn children
    this._master ? this.children () : this.run ();
  }

  /**
   * Runs Eden
   */
  run () {
    // Load eden
    const eden = require ('lib/eden');

    // Log spawning threads
    this._logger.log ('info', 'Spawned new ' + ((process.env.express === 'true') ? 'Express' : 'Compute') + ' thread', {
      'class' : 'Eden'
    });

    // Run single Eden instance
    eden.start ({
      'id'      : process.env.id,
      'port'    : parseInt (process.env.port),
      'host'    : process.env.host,
      'logger'  : this._logger,
      'express' : (process.env.express === 'true')
    });
  }

  /**
   * On cluster worker exit
   *
   * @param {Object} worker
   */
  exit (worker) {
    // Set id
    const id      = worker.process.env.id;
    const express = worker.process.env.express === 'true';

    // Spawn new thread
    this.spawn (parseInt (id), express, (parseInt (config.get ('port')) + parseInt (id)));
  }

  /**
   * Spawns new App thread
   *
   * @param {Number}  id
   * @param {Boolean} express
   * @param {Number}  port
   */
  spawn (id, express, port) {
    // Clone environment
    const env = JSON.parse (JSON.stringify (process.env));

    // Set thread id
    env.id      = id;
    env.express = express ? 'true' : 'false';

    // Check port
    if (port) env.port = port;

    // Fork new thread
    this._workers[(express ? 'express' : 'compute') + ':' + id] = cluster.fork (env);
    this._workers[(express ? 'express' : 'compute') + ':' + id].process.env = env;
  }

  /**
   * Builds logger
   */
  logger () {
    // Set logger
    this._logger = new winston.Logger ({
      'level'      : config.get ('logLevel')  || 'info',
      'transports' : [
        new winston.transports.Console ({
          'colorize'  : true,
          'formatter' : log,
          'timestamp' : true
        })
      ]
    });
  }

  /**
   * Spawns child processes
   */
  children () {
    // Log running Eden
    this._logger.log ('info', 'Running Eden', {
      'class' : 'Eden'
    });

    // Count frontend express threads
    const expressThreads = config.get ('expressThreads') || config.get ('expressThreads') === 0 ? config.get ('expressThreads') : os.cpus ().length;

    // Count backend compute threads
    const computeThreads = config.get ('computeThreads') || config.get ('computeThreads') === 0 ? config.get ('computeThreads') : 1;

    // Log spawning Express threads
    this._logger.log ('info', 'Spawning ' + expressThreads + ' Eden Express thread' + (expressThreads > 1 ? 's' : ''), {
      'class' : 'Eden'
    });

    // Loop Express threads
    for (let a = 0; a < expressThreads; a++) {
      // Spawn new thread
      this.spawn (a, true, (parseInt (config.get ('port')) + a));
    }

    // Log spawning Compute threads
    this._logger.log ('info', 'Spawning ' + computeThreads + ' Eden Compute thread' + (computeThreads > 1 ? 's' : ''), {
      'class' : 'Eden'
    });

    // Loop Compute threads
    for (let b = 0; b < computeThreads; b++) {
      // Spawn new thread
      this.spawn (b, false);
    }

    // On cluster exit
    cluster.on ('exit', this.exit);
  }
}

/**
 * Export new Eden App instance
 *
 * @type {App}
 */
module.exports = new App ();
