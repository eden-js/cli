// Require dependencies
const colors = require('colors');

/**
 * Export log functionality
 *
 * @param {object} options
 *
 * @returns {function(object): string}
 */
exports = module.exports = (options) => {
  // Set message string
  let message = '';

  // Return string will be passed to logger.
  const d = new Date();

  // Set timestamp strings
  let h = d.getHours() + '';

  // Augment hours
  h = h.length === 1 ? '0' + h : h;

  // Set minutes
  let m = d.getMinutes() + '';

  // Augment minutes
  m = m.length === 1 ? '0' + m : m;

  // Set seconds
  let s = d.getSeconds() + '';

  // Augment seconds
  s = s.length === 1 ? '0' + s : s;

  // Set time
  if (options.timestamp) message += '[' + colors.grey(h + ':' + m + ':' + s) + '] ';

  // Set thread type
  if (typeof process.env.express !== 'undefined') {
    // Check express
    let express = process.env.express === 'true';

    // Add to message
    message += '[' + colors[(express ? 'blue' : 'yellow')]((express ? 'Express' : 'Compute') + '' + ((typeof process.env.id !== 'undefined') ? ' #' + process.env.id : '')) + '] ';
  } else {
    message += '[' + colors.red('Master') + '] ';
  }

  // Set framework stamp
  if (options.showLevel) message += '[' + colors.cyan(options.level.toUpperCase()) + '] ';

  // Set meta tags
  if (options.meta && options.meta.class) {
    // Set message
    message += '[' + colors.green(options.meta.class) + '] ';
  }

  // Return message
  return message + options.message;
};
