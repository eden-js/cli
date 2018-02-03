# EdenJS

[![bitHound Overall Score](https://img.shields.io/bithound/code/github/eden-js/eden.svg?label=bitHound%20Overall%20Score&style=flat-square)](https://www.bithound.io/github/eden-js/eden)
[![Issues](https://img.shields.io/github/issues/eden-js/eden.svg?style=flat-square)](https://github.com/eden-js/eden/issues)
[![Dependencies](https://david-dm.org/eden-js/eden.svg?style=flat-square)](https://github.com/eden-js/eden)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/eden-js/eden)
[![Awesome](https://img.shields.io/badge/awesome-true-green.svg?style=flat-square)](https://github.com/eden-js/eden)

Awesome isomorphic NodeJS skeleton for structured applications.
Just take a look at its bundles.

## Why

There are many very good Node/Express/Mongo frameworks around. There is no true "correct" way of build your applications skeleton, what EdenJS tries to do is give you a boilerplate bootstrap/express/mongoDB base for large bundled NodeJS applications.

## Features

- Based on ES6 async/await
- Out of the box MVC structured development environment
- Established [expressJS](https://github.com/expressjs/express) application base that you're already used to
- Fully real time with [socketio](https://github.com/socketio/socket.io)
- Extremely fast isomorphic rendering with [riotJS](https://github.com/riot/riot)
- Extensible models with [mongorito](https://github.com/vadimdemedes/mongorito)

## Quick Development

```js
// use strict
'use strict';

// require local dependencies
var alert      = require ('alert');
var controller = require ('controller');

/**
 * build example controller
 */
class example extends controller {
  /**
   * get index action
   *
   * @route {get} /
   */
  indexAction (req, res, next) {
    // the same as router.get ('/', example.indexAction)
    // uses standard expressJS router
    // SSR with riotJS
    res.render ('home');

    // alert user
    alert.user (req.user, 'success', 'successfully loaded index');
  }

  /**
   * socketio event emit
   *
   * @socket event
   */
  eventSocket (Socket, data, User) {
    // out of the box socket transport with authentication

    // emit directly
    Socket.emit ('data', {});

    // alert socket
    alert.socket (Socket, 'success', 'successfully received event');
  }
}

/**
 * export example controller
 * @type {example}
 */
module.exports = example;
```

## Installation

The entire framework has been written to be built and compiled with gulp. To install and run the boilerplate is as simple as:

```
// deploy EdenJS
git init; git remote add origin https://github.com/eden-js/eden.git; git pull;

// development
npm install; gulp;

// install (for production)
gulp install;

// run in production
node app;
```
