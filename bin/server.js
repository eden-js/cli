#!/usr/bin/env node
/**
 * Created by Awesome on 1/30/2016.
 */

// use strict
'use strict';

// require dependencies
var path  = require('path');
var http  = require('http');
var debug = require('debug');

// set global variables
global.appRoot = path.dirname(path.resolve(__dirname));

// require local dependencies
var app    = require('../app');
var config = require('../config');

/**
 * build server class
 */
class server {
    /**
     * construct server builder class
     */
    constructor() {
        // bind variables
        this.debugger = false;
        this.port     = false;
        this.server   = false;

        // bind methods
        this.onError  = this.onError.bind(this);
        this.onListen = this.onListen.bind(this);

        // bind private methods
        this._registerDebugger = this._registerDebugger.bind(this);
        this._registerPort     = this._registerPort.bind(this);
        this._registerServer   = this._registerServer.bind(this);

        // run server bootstrap
        this._registerDebugger();
        this._registerPort();
        this._registerServer();

        // build app
        app.set('port', this.port);

        // run app
        this.server.listen(this.port);

        // server events
        this.server.on('error', this.onError);
        this.server.on('listening', this.onListen);
    }

    /**
     * on error function
     *
     * @param error
     */
    onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof this.port === 'string'
            ? 'Pipe ' + this.port
            : 'Port ' + this.port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * on listen function
     */
    onListen() {
        var addr = this.server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        this.debugger('Listening on ' + bind);
    }

    /**
     * registers server debugger
     *
     * @private
     */
    _registerDebugger() {
        this.debugger = debug('EdenFrame:server');
    }

    /**
     * registers port
     *
     * @private
     */
    _registerPort() {
        this.port = parseInt((process.env.PORT || config.port), 10);
    }

    /**
     * registers server
     *
     * @private
     */
    _registerServer() {
        this.server = http.createServer(app);
    }
}

/**
 * export server bootstrap
 *
 * @type {server}
 */
module.exports = new server();