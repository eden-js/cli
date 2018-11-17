// Require dependencies
const colors = require('colors');

// Require format
const {
  format,
} = require('winston');

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
  message += `[${colors.grey(`${h}:${m}:${s}`)}] `;

  // Set thread type
  if (typeof process.env.express !== 'undefined') {
    // Check express
    const express = process.env.express === 'true';

    // Add to message
    message += `[${colors[(express ? 'blue' : 'yellow')](`${express ? 'Express' : 'Compute'}${(typeof process.env.id !== 'undefined') ? ` #${process.env.id}` : ''}`)}] `;
  } else {
    message += `[${colors.red('Master')}] `;
  }

  // Set framework stamp
  message += `[${colors.cyan(info.level.toUpperCase())}] `;

  // Set meta tags
  if (info && info.class) {
    // Set message
    message += `[${colors.green(info.class)}] `;
  }

  // Return message
  return message + info.message;
});
