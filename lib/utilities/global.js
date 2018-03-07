/**
 * create global functions
 */

// require dependencies
const fs = require ('fs-extra');

// load models
const models = fs.existsSync ('app/cache/models.json') ? require ('app/cache/models.json') : {};

/**
 * loads cache global
 *
 * @param  {String} name [description]
 *
 * @return {*} loaded
 */
global.cache = (name) => {
  // check model name
  name = 'app/cache/' + name;

  // return required model
  try {
    // load model class
    var loaded = require (name);

    // resolve model
    return loaded;
  } catch (e) {
    // throw
    throw e;
  }
};

/**
 * loads model global
 *
 * @param  {String} name [description]
 *
 * @return {*} loaded
 */
global.model = (name) => {
  // check model name
  name = name.split ('/')[name.split ('/').length - 1].split ('.')[0].toLowerCase ();

  // check if model exists
  if (!models[name]) {
    // throw error
    throw new Error ('the model ' + name + ' does not exist');
  }

  // return required model
  try {
    // load model class
    var loaded = require (global.appRoot + models[name]);

    // resolve model
    return loaded;
  } catch (e) {
    // throw
    throw e;
  }
};

/**
 * loads helper global
 *
 * @param  {String} name [description]
 *
 * @return {*} loaded
 */
global.helper = (name) => {
  // check model name
  name = name.split ('/')[0] + '/helpers/' + name.split ('/')[name.split ('/').length - 1];

  // return required model
  try {
    // load model class
    var loaded = require (name);

    // resolve model
    return loaded;
  } catch (e) {
    // throw
    throw e;
  }
};
