// Require dependencies
import chalk from 'chalk';

// Require format
import { format } from 'winston';

/**
 * Export log functionality
 *
 * @param {object} info
 *
 * @returns {function(object): string}
 */
export default format.printf((info) => {
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
  if (global.isCLI) {
    // send CLI message
    message += `[${chalk.red('CLI')}] `;
  } else if (process.env.cluster) {
    // Add to message
    message += `[${chalk.blue(`${process.env.cluster}${(typeof process.env.id !== 'undefined') ? ` #${process.env.id}` : ''}`)}] `;
  } else {
    message += `[${chalk.red('Master')}] `;
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
