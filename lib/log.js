// Require dependencies
const chalk = require('chalk');
const { format } = require('winston');

/**
 * Export log functionality
 *
 * @param {object} info
 *
 * @returns {function(object): string}
 */
module.exports = format.printf((info) => {
  // Set message string
  let message = '';

  // Return string will be passed to logger.
  const d = new Date();

  // Set timestamp strings
  let h = `${d.getHours()}`;

  // Augment hours
  h = h.length === 1 ? `0${h}` : h;

  // Set minutes
  let m = `${d.getMinutes()}`;

  // Augment minutes
  m = m.length === 1 ? `0${m}` : m;

  // Set seconds
  let s = `${d.getSeconds()}`;

  // Augment seconds
  s = s.length === 1 ? `0${s}` : s;

  // Set time
  message += `[${chalk.grey(`${h}:${m}:${s}`)}] `;

  // Set thread type
  if (global.CLI) {
    // send CLI message
    message += `[${chalk.red('cli')}] `;
  } else if (global.cluster) {
    // Add to message
    message += `[${chalk.blue(`${global.cluster}`)}] `;
  } else {
    message += `[${chalk.red('master')}] `;
  }

  // Set framework stamp
  message += `[${chalk.cyan(info.level.toUpperCase())}] `;

  // Set meta tags
  if (info && info.class) {
    // Set message
    message += `[${chalk.green(info.class)}] `;
  }

  // Return message
  return message + info.message;
});
