# EdenFrame

[![bitHound Overall Score](https://www.bithound.io/github/Alex-iFactory/eden/badges/score.svg?style=flat-square)](https://www.bithound.io/github/Alex-iFactory/eden)
[![issues](https://img.shields.io/github/issues/Alex-iFactory/eden.svg?style=flat-square)](https://github.com/Alex-iFactory/eden/issues)
[![dependencies](https://david-dm.org/Alex-iFactory/eden.svg?style=flat-square)](https://github.com/Alex-iFactory/eden)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/Alex-iFactory/eden)
[![Awesome](https://img.shields.io/badge/awesome-true-green.svg?style=flat-square)](https://github.com/Alex-iFactory/eden)

#### EdenFrame: A **complete MVC component based framework** for building **express** web applications.

There are a variety of very good Node/Express/Mongo frameworks around. There is no true "correct" way of build your applications skeleton, what EdenFrame tries to do is give you a boilerplate bootstrap/express/mongoDB base for large component based NodeJS applications.

This framework has been inspired by the conventions of  [Symfony2 and standard PHP MVC](http://symfony.com/blog/introducing-the-symfony-demo-application) based frameworks, but written on a NodeJS base. You will find bundles laid out in a very similar fashon to what you would find in most standard MVC frameworks.

Dependencies
--------

This framework has been built with a few required dependencies of the server:

- MongoDB
- Redis
- Nginx _or any other webserver, however configuration needs to be converted_

Installation
--------

The entire framework has been written to be built and compiled with gulp. To install and run the boilerplate is as simple as:

```js
    // development
    npm install; gulp;

    // install (for production)
    gulp install;

    // run in production
    node app;
```
