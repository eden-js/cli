/**
 * Create global functions
 */

// Require dependencies
const fs = require ('fs-extra');

// Load models
const models = fs.existsSync ('app/cache/models.json') ? require ('app/cache/models.json') : {};

/**
 * Loads cache global
 *
 * @param  {String} name [description]
 *
 * @return {*} loaded
 */
global.cache = (name) => {
  // Set cache name
  name = 'app/cache/' + name;

  // Try/Catch
  try {
    // Return required cache
    return require (name);
  } catch (e) {
    // Throw error
    throw e;
  }
};

/**
 * Loads model global
 *
 * @param  {String} name [description]
 *
 * @return {Model} loaded
 */
global.model = (name) => {
  // Set model name
  name = name.split ('/')[name.split ('/').length - 1].split ('.')[0].toLowerCase ();

  // Check if model exists
  if (!models[name]) {
    // Throw error
    throw new Error ('The model ' + name + ' does not exist');
  }

  // Try/Catch
  try {
    // Return required Model class
    return require (global.appRoot + models[name]);
  } catch (e) {
    // Throw error
    throw e;
  }
};

/**
 * Loads helper global
 *
 * @param  {String} name [description]
 *
 * @return {Helper} loaded
 */
global.helper = (name) => {
  // Set helper name
  name = name.split ('/')[0] + '/helpers/' + name.split ('/')[name.split ('/').length - 1];

  // Try/Catch
  try {
    // Return required Helper class
    return require (name);
  } catch (e) {
    // Throw
    throw e;
  }
};
