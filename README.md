# EdenFrame

[![bitHound Overall Score](https://www.bithound.io/github/Alex-iFactory/eden/badges/score.svg?style=flat-square)](https://www.bithound.io/github/eden-js/eden)
[![issues](https://img.shields.io/github/issues/eden-js/eden.svg?style=flat-square)](https://github.com/eden-js/eden/issues)
[![dependencies](https://david-dm.org/eden-js/eden.svg?style=flat-square)](https://github.com/eden-js/eden)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/eden-js/eden)
[![Awesome](https://img.shields.io/badge/awesome-true-green.svg?style=flat-square)](https://github.com/eden-js/eden)

#### EdenFrame: A **complete MVC component based framework** for building **express** web applications.

There are a variety of very good Node/Express/Mongo frameworks around. There is no true "correct" way of build your applications skeleton, what EdenFrame tries to do is give you a boilerplate bootstrap/express/mongoDB base for large component based NodeJS applications.

This framework has been inspired by the conventions of  [Symfony2 and standard PHP MVC](http://symfony.com/blog/introducing-the-symfony-demo-application) based frameworks, but written on a NodeJS base. You will find bundles laid out in a very similar fashon to what you would find in most standard MVC frameworks.

Dependencies
--------

This framework has been built with a few required dependencies of the server:

- MongoDB
- Redis
- Nginx _or any other webserver, however configuration needs to be converted_

Configuration
--------

All base configuration information is found in `config.js` and example configuration in `config.example.js` in the root of the project. Please update this with MongoDB/bootstrap/other information before installing

Installation
--------

The entire framework has been written to be built and compiled with gulp. To install and run the boilerplate is as simple as:

```
// development
npm install; gulp;

// install (for production)
gulp install;

// run in production
node app;
```
