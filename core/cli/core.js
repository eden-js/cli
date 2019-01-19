const chalk            = require('chalk');
const extractComments  = require('extract-comments');
const fs               = require('fs-extra');
const Path             = require('path');
const yargonaut        = require('yargonaut'); // Must precede yargs

// Set yargs colors
yargonaut
  .style('underline.green')
  .errorsStyle('red');

function cli(yy) {
  // Hashbang must be removed for comment parser to work
  // I know this is stupid but it looks cool at the top of the script too :)
  const extractedComments = extractComments(fs.readFileSync(Path.join(global.edenRoot, 'index.js'), 'utf8').split('\n').slice(1).join('\n'));
  const subText = extractedComments[0].raw;
  const logo = extractedComments[1].raw;

  // set process arguments
  return yy
    .usage(`${chalk.green(logo)}\n${chalk.bold(subText)}\n\nUsage: $0 <command> [options]`)
    .strict()
    .wrap(Math.min(100, yy.terminalWidth()))
    .demandCommand(1)
    .help('help', 'Show usage instructions')
    .alias('help', 'h');
}

function start(yy) {
  return yy
    .strict(false); // Additional options will be done in lib/aliases/config.js
}

function run(yy) {
  return yy
    .strict(false) // Additional options will be done in lib/aliases/config.js
    .positional('fn', {
      desc    : 'Gulp function to run',
      default : 'dev',
      type    : 'string',
    })
    .choices('fn', ['dev', 'install']);
}

function init(yy) {
  return yy
    .positional('dirType', {
      desc : 'EdenJS directory type',
      type : 'string',
    })
    .choices('dirType', ['app', 'module'])
    .option('migrateGit', {
      alias    : 'g',
      describe : 'Migrate .git directory if misplaced in current directory',
    });
}

module.exports = [
  {
    command     : null,
    fn          : cli,
    description : null,
  },
  {
    command     : 'start',
    fn          : start,
    description : 'Starts EdenJS in production.',
  },
  {
    command     : 'run [fn]',
    fn          : run,
    description : 'Runs EdenJS gulp function.',
  },
  {
    command     : 'init <dirType>',
    fn          : init,
    description : 'Initialize new or fix existing EdenJS directory.',
  },
];
