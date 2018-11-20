#!/usr/bin/env node

// Require dependencies
const minimist = require('minimist');

// Parse arguments
const processArgs = minimist(process.argv.slice(2));

function range(bottom, top) {
  return [...[...new Array((top - bottom) + 1)].keys()].map(n => n + bottom);
}

(async () => {
  if (processArgs._[0] === 'build') {
    const gulp = require('gulp'); // eslint-disable-line global-require
    require('./gulpfile.js'); // eslint-disable-line global-require

    // Enable console as is only for a pre-application install script
    /* eslint-disable no-console */

    gulp.on('task_start', (e) => {
      console.log('Gulp task started:', e.task);
    });

    gulp.on('task_stop', (e) => {
      if (e.task === 'install') {
        console.log('Installation over.');
      } else {
        console.log('Gulp task stopped:', e.task);
      }
    });

    gulp.on('task_err', (e) => {
      console.log('gulp task error', e);
    });

    gulp.on('task_not_found', (e) => {
      console.log('Gulp cant find task:', e.task);
    });

    gulp.on('err', (e) => {
      console.log('gulp error', e);
    });

    /* eslint-enable no-console */

    gulp.start('install');
  } else if (processArgs._[0] === 'run') {
    const App = require('./app.js'); // eslint-disable-line global-require

    let expressThreads = null;
    let computeThreads = null;

    if (processArgs.expressThreads) {
      if (processArgs.expressThreads === '-1') {
        expressThreads = false;
      } else {
        expressThreads = range(...processArgs.expressThreads.split('-').map(ns => parseInt(ns, 10)));
      }
    }

    if (processArgs.computeThreads) {
      if (processArgs.computeThreads === '-1') {
        computeThreads = false;
      } else {
        computeThreads = range(...processArgs.computeThreads.split('-').map(ns => parseInt(ns, 10)));
      }
    }

    new App({ // eslint-disable-line no-new
      expressThreads,
      computeThreads,
    });
  }
})();
