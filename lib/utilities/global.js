/**
 * Create global functions
 */

// Require dependencies
const fs   = require('fs-extra');
const Path = require('path');

// Load models
const models = fs.existsSync(Path.resolve(`${global.appRoot}/data/cache/models.json`)) ? require('cache/models.json') : {};

/**
 * Loads cache global
 *
 * @param  {string} name [description]
 *
 * @return {*} loaded
 */
global.cache = (name) => {
  // Set cache name
  const fmtName = Path.join(global.appRoot, 'data', 'cache', name);

  // Try/Catch
  try {
    // Return required cache
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(fmtName);
  } catch (e) { console.log(e) }

  // return null
  return null;
};

/**
 * Loads model global
 *
 * @param  {string} name [description]
 *
 * @return {Model} loaded
 */
global.model = (name) => {
  // Set model name
  const fmtName = Path.basename(name).split('.')[0].toLowerCase();

  // Check if model exists
  if (!models[fmtName]) {
    // Throw error
    throw new Error(`The model '${fmtName}' does not exist`);
  }

  // Try/Catch
  try {
    // Return required Model class
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(models[fmtName]);
    // return require(Path.join(global.appRoot, models[fmtName]));
  } catch (e) { console.log(e) }

  // return null
  return null;
};

/**
 * Loads helper global
 *
 * @param  {string} name [description]
 *
 * @return {Helper} loaded
 */
global.helper = (name) => {
  // Set helper name
  const fmtName = `${name.split('/')[0]}/helpers/${name.split('/')[name.split('/').length - 1]}`;

  // Try/Catch
  try {
    // Return required Helper class
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(fmtName);
  } catch (e) { console.log(e) }

  // return null
  return null;
};
