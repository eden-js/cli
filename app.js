#!/usr/bin/env node

// use strict
'use strict';

// require environment
require ('./lib/env');

// require dependencies
const os      = require ('os');
const cluster = require ('cluster');
const winston = require ('winston');

// require local dependencies
const log    = require ('lib/utilities/log');
const eden   = require ('lib/eden');
const config = require ('app/config');

// set global environment
global.envrionment = process.env.NODE_ENV || config.environment;

/**
 * build app class
 */
class app {
  /**
   * construct app class
   */
  constructor () {
    // bind private variables
    this._master  = cluster.isMaster;
    this._logger  = false;
    this._workers = {};

    // bind variables
    this.run      = this.run.bind (this);
    this.exit     = this.exit.bind (this);
    this.spawn    = this.spawn.bind (this);
    this.logger   = this.logger.bind (this);
    this.children = this.children.bind (this);

    // build logger
    this.logger ();

    // spawn children
    this._master ? this.children () : this.run ();
  }

  /**
   * runs edenJS
   */
  run () {
    // log spawning threads
    this._logger.log ('info', 'spawned new ' + ((process.env.express === 'true') ? 'express' : 'compute') + ' thread', {
      'class' : 'eden'
    });

    // run single instance
    global.eden = new eden ({
      'id'      : process.env.id,
      'port'    : parseInt (process.env.port),
      'logger'  : this._logger,
      'express' : (process.env.express === 'true')
    });
  }

  /**
   * on cluster worker exit
   *
   * @param {Object} worker
   */
  exit (worker) {
    // set id
    let id      = worker.process.env.id;
    let express = worker.process.env.express === 'true';

    // spawn new thread
    this.spawn (parseInt (id), express, (parseInt (config.port) + parseInt (id)));
  }

  /**
   * spawns new app thread
   *
   * @param {Integer} id
   * @param {Boolean} express
   * @param {Mixed}   port
   */
  spawn (id, express, port) {
    // clone environment
    let env = JSON.parse (JSON.stringify (process.env));

    // set thread id
    env.id      = id;
    env.express = express ? 'true' : 'false';

    // check port
    if (port) env.port = port;

    // fork new thread
    this._workers[(express ? 'express' : 'compute') + ':' + id] = cluster.fork (env);
    this._workers[(express ? 'express' : 'compute') + ':' + id].process.env = env;
  }

  /**
   * builds logger
   */
  logger () {
    // set logger
    this._logger = new winston.Logger ({
      level      : config.logLevel  || 'info',
      transports : [
        new (winston.transports.Console) ({
          colorize  : true,
          formatter : log,
          timestamp : true
        })
      ]
    });
  }

  /**
   * spawns child processes
   */
  children () {
    // run in production
    this._logger.log ('info', 'Running edenJS', {
      'class' : 'eden'
    });

    // count frontend threads
    let expressThreads = config.expressThreads || config.expressThreads === 0 ? config.expressThreads : os.cpus ().length;

    // count backend threads
    let computeThreads = config.computeThreads || config.computeThreads === 0 ? config.computeThreads : 1;

    // log spawning threads
    this._logger.log ('info', 'Spawning ' + expressThreads + ' eden express thread' + (expressThreads > 1 ? 's' : ''), {
      'class' : 'eden'
    });

    // loop express threads
    for (var a = 0; a < expressThreads; a++) {
      // spawn new thread
      this.spawn (a, true, (parseInt (config.port) + a));
    }

    // log spawning threads
    this._logger.log ('info', 'Spawning ' + computeThreads + ' eden compute thread' + (computeThreads > 1 ? 's' : ''), {
      'class' : 'eden'
    });

    // loop compute threads
    for (var b = 0; b < computeThreads; b++) {
      // spawn new thread
      this.spawn (b, false);
    }

    // on cluster exit
    cluster.on ('exit', this.exit);
  }
}

/**
 * create eden app
 *
 * @type {app}
 */
module.exports = new app ();
