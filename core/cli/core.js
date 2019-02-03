const chalk           = require('chalk');
const extractComments = require('extract-comments');
const fs              = require('fs-extra');
const Path            = require('path');
const yargonaut       = require('yargonaut'); // Must precede yargs
const prettyTime      = require('pretty-hrtime');

const initEden = require('lib/utilities/init');

// Set yargs colors
yargonaut
  .style('underline.green')
  .errorsStyle('red');

function cliCommand(yy) {
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

function startCommand(yy) {
  return yy
    .strict(false); // Additional options will be done in lib/aliases/config.js
}

async function startHandler() {
  // setup globals
  global.isCLI = false;

  // require base app
  const App = require(Path.join(global.edenRoot, 'app.js')); // eslint-disable-line global-require, import/no-dynamic-require

  // run base app
  new App(); // eslint-disable-line no-new

  // The ride never ends
  return new Promise(() => {});
}

function runCommand(yy) {
  return yy
    .strict(false) // Additional options will be done in lib/aliases/config.js
    .positional('fn', {
      desc    : 'Gulp function to run',
      default : 'dev',
      type    : 'string',
    })
    .choices('fn', ['dev', 'install']);
}

async function runHandler(args) {
  // run gulp logic (imports are local here for CLI optimization)
  const gulp = require('gulp'); // eslint-disable-line global-require
  require(Path.join(global.edenRoot, 'gulpfile.js')); // eslint-disable-line global-require, import/no-dynamic-require

  const loggedErrors = [];

  // add start logging
  gulp.on('start', (evt) => {
    this._logger.log(evt.branch ? 'debug' : 'info', `[${chalk.cyan(evt.name)}] Starting`);
  });

  // add stop logging
  gulp.on('stop', (evt) => {
    this._logger.log(evt.branch ? 'debug' : 'info', `[${chalk.cyan(evt.name)}] Finished in ${chalk.magenta(prettyTime(evt.duration))}`);
  });

  // on error
  gulp.on('error', (evt) => {
    this._logger.log(evt.branch ? 'debug' : 'error', `[${chalk.cyan(evt.name)}] Errored after ${chalk.magenta(prettyTime(evt.duration))}`);
    if (!loggedErrors.includes(evt.error)) {
      loggedErrors.push(evt.error);
      global.printError(evt.error);
    }
  });

  // run task
  await new Promise((resolve, reject) => {
    gulp.series([args.fn === 'dev' ? 'default' : args.fn])((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function initCommand(yy) {
  return yy
    .positional('dirType', {
      desc    : 'EdenJS directory type',
      type    : 'string',
    })
    .choices('dirType', ['app', 'module', 'none'])
    .option('migrateGit', {
      alias    : 'g',
      describe : 'Migrate .git directory if misplaced in current directory',
    });
}

async function initHandler(args) {
  const res = await initEden(args.dirType, args.migrateGit);

  this._logger.log('info', `[${chalk.green('init')}] Finished initializing ${res}`);
}

module.exports = [
  {
    command     : null,
    fn          : cliCommand,
    description : null,
  },
  {
    command     : 'start',
    handler     : startHandler,
    fn          : startCommand,
    description : 'Starts EdenJS in production.',
  },
  {
    command     : 'run [fn]',
    handler     : runHandler,
    fn          : runCommand,
    description : 'Runs EdenJS gulp function.',
  },
  {
    command     : 'init [dirType]',
    handler     : initHandler,
    fn          : initCommand,
    description : 'Initialize new or fix existing EdenJS directory.',
  },
];
