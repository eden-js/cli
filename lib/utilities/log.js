
// load dependencies
const colors = require ('colors');

/**
 * export log functionality
 *
 * @param {Object} options
 *
 * @returns {*}
 */
exports = module.exports = (options) => {
  // set message string
  let message = '';

  // return string will be passed to logger.
  let d = new Date ();

  // set timestamp strings
  let h = d.getHours () + '';

  // augment hours
  h = h.length === 1 ? '0' + h : h;

  // set minutes
  let m = d.getMinutes () + '';

  // augment minutes
  m = m.length === 1 ? '0' + m : m;

  // set seconds
  let s = d.getSeconds () + '';

  // augment seconds
  s = s.length === 1 ? '0' + s : s;

  // set time
  if (options.timestamp) message += '[' + colors.grey (h + ':' + m + ':' + s) + '] ';

  // set thread type
  if (typeof process.env.express !== 'undefined') {
    // check express
    let express = process.env.express === 'true';

    // add to message
    message += '[' + colors[(express ? 'blue' : 'yellow')] ((express ? 'express' : 'compute') + '' + ((typeof process.env.id !== 'undefined') ? ' #' + process.env.id : '')) + '] ';
  } else {
    message += '[' + colors.red ('master') + '] ';
  }

  // set framework stamp
  if (options.showLevel) message += '[' + colors.cyan (options.level.toUpperCase ()) + '] ';

  // set meta tags
  if (options.meta && options.meta.class) {
    // set message
    message += '[' + colors.green (options.meta.class) + '] ';
  }

  // set message
  message += options.message;

  // return message
  return message;
};
