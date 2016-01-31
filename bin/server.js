#!/usr/bin/env node

// global approot variable
var path = require('path');
global.appRoot = path.dirname(path.resolve(__dirname));

// import app dependencies
var app    = require(global.appRoot + '/app');
var http   = require('http');
var config = require(global.appRoot + '/config');

// create debug
var debug = require('debug')('EdenFrame:server');

// get port from environment or default
var port = normalizePort(process.env.PORT || config.port);
app.set('port', port);

// create http server
var server = http.createServer(app);

// listen on port
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * normalize port function
 * @param val
 * @returns {*}
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * on error function
 * @param error
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

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
 * on listening
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
