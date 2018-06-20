
// load dependencies
const colors = require ('colors');

// require format
const {
  format
} = require ('winston');

/**
 * export log functionality
 *
 * @param {Object} info
 *
 * @returns {*}
 */
exports = module.exports = format.printf ((info) => {
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
  message += '[' + colors.grey (h + ':' + m + ':' + s) + '] ';

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
  message += '[' + colors.cyan (info.level.toUpperCase ()) + '] ';

  // set meta tags
  if (info && info.class) {
    // set message
    message += '[' + colors.green (info.class) + '] ';
  }

  // set message
  message += info.message;

  // return message
  return message;
});
