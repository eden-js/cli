#!/usr/bin/env node

/* eslint no-console: 0 */

// Require dependencies
const minimist = require('minimist');
const fs = require('fs-extra');
const path = require('path');
const glob = require('globby');

// Parse arguments
const processArgs = minimist(process.argv.slice(2));

function range(bottom, top) {
  return [...[...new Array((top - bottom) + 1)].keys()].map(n => n + bottom);
}

function runGulp(runServer = false) {
  const gulp = require('gulp'); // eslint-disable-line global-require
  require('./gulpfile.js'); // eslint-disable-line global-require

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

  gulp.start(runServer ? 'default' : 'install');
}

function runEden(expressThreads, computeThreads) {
  const App = require('./app.js'); // eslint-disable-line global-require

  new App({ // eslint-disable-line no-new
    expressThreads,
    computeThreads,
  });
}

async function edenExistsIn(dir) {
  try {
    const olderBundlesPath = path.join(dir, 'app', 'bundles');

    if (await fs.pathExists(olderBundlesPath)) {
      return 'oldApp';
    }

    const configPath = path.join(dir, 'config.js');

    if (await fs.pathExists(configPath)) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const configFile = require(configPath);

      // Make sure its edenjs-like first
      if (typeof configFile === 'object' && typeof configFile.domain === 'string' && typeof configFile.version === 'string') {
        return 'app';
      }
    }

    const rootJsPaths = await glob('./*.js');

    const bundlesPath = path.join(dir, 'bundles');

    if (await fs.pathExists(bundlesPath)) {
      if (rootJsPaths.length === 0) {
        return 'module';
      } if (rootJsPaths.length === 1 && rootJsPaths[0] === 'index.js') {
        const indexText = await fs.readFile(path.join(dir, 'index.js'), 'utf8');

        if (indexText.match(/^\/\/ EdenJS module does not require an index$/m)) {
          return 'module';
        }
      }
    }

    const edenStructuredFiles = await glob('./*/{controllers,models,views,daemons,helpers}/*.js');

    if (edenStructuredFiles.length > 3) {
      return 'oldAppBundles';
    }
  } catch (err) { /* */ }

  return 'none';
}

async function initEden(suppliedDirType = null, migrateGit = false) {
  let dirType = await edenExistsIn(process.cwd());

  // If no type manually specified, and nothing existing found, do nothing
  if (suppliedDirType === null && dirType === 'none') {
    return;
  }

  const shouldMakeIntoApp = (suppliedDirType === null && (dirType === 'app' || dirType === 'oldApp' || dirType === 'oldAppBundles')) || suppliedDirType === 'app';
  const shouldMakeIntoModule = (suppliedDirType === null && dirType === 'module') || suppliedDirType === 'module';

  let hasConfig = false;

  // oldApp => app
  if (dirType === 'oldApp' && shouldMakeIntoApp) {
    // Move config and bundles to correct place
    await fs.copy(path.join(process.cwd(), 'app', 'bundles'), path.join(process.cwd(), 'bundles'));

    if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'app', 'config.js'))) {
      await fs.copy(path.join(process.cwd(), 'app', 'config.js'), path.join(process.cwd(), 'config.js'));
      hasConfig = true;
    }

    // Remove edenjs install and junk
    await Promise.all([
      fs.remove(path.join(process.cwd(), 'CONTRIBUTING.md')),
      fs.remove(path.join(process.cwd(), 'LICENSE')),
      fs.remove(path.join(process.cwd(), 'README.md')),
      fs.remove(path.join(process.cwd(), 'TUTORIAL.md')),
      fs.remove(path.join(process.cwd(), 'app.js')),
      fs.remove(path.join(process.cwd(), 'gulpfile.js')),
      fs.remove(path.join(process.cwd(), 'lib')),
      fs.remove(path.join(process.cwd(), 'tests')),
      fs.remove(path.join(process.cwd(), 'package.json')),
      fs.remove(path.join(process.cwd(), 'package-lock.json')),
      fs.remove(path.join(process.cwd(), 'www')),
      fs.remove(path.join(process.cwd(), 'app')),
      fs.remove(path.join(process.cwd(), '.git')),
      fs.remove(path.join(process.cwd(), '.editorconfig')),
      fs.remove(path.join(process.cwd(), '.eslintrc.json')),
      fs.remove(path.join(process.cwd(), '.gitattributes')),
      fs.remove(path.join(process.cwd(), '.gitignore')),
    ]);

    dirType = 'app';
  }

  // oldAppBundles => app
  if (dirType === 'oldAppBundles' && shouldMakeIntoApp) {
    const paths = await glob(['./*'], {
      onlyFiles : false,
    });

    await fs.ensureDir(path.join(process.cwd(), 'bundles'));

    for (const p of paths) {
      console.log('mv', path.join(process.cwd(), p), path.join(process.cwd(), 'bundles', p));
      await fs.move(path.join(process.cwd(), p), path.join(process.cwd(), 'bundles', p));
    }

    dirType = 'app';
  }

  // Cleanup app-y junk
  if (dirType === 'app') {
    // Remove edenjs install and junk
    await Promise.all([
      fs.remove(path.join(process.cwd(), 'yarn.lock')),
      fs.remove(path.join(process.cwd(), '.htaccess')),
      fs.remove(path.join(process.cwd(), '.npm-debug.log')),
      fs.remove(path.join(process.cwd(), '.yarn-error.log')),
      fs.remove(path.join(process.cwd(), 'node_modules')),
      fs.remove(path.join(process.cwd(), '.idea')),
      fs.remove(path.join(process.cwd(), '.remote-sync.json')),
    ]);
  }

  // Make sure data directory is clean
  if (!shouldMakeIntoModule) {
    await fs.ensureDir(path.join(process.cwd(), 'data'));
  }

  if (dirType === 'module' || dirType === 'app') {
    // Remove junk files in bundles/
    await Promise.all([
      fs.remove(path.join(process.cwd(), 'bundles', 'yarn.lock')),
      fs.remove(path.join(process.cwd(), 'bundles', 'package-lock.json')),
      fs.remove(path.join(process.cwd(), 'bundles', 'package.json')),
      fs.remove(path.join(process.cwd(), 'bundles', 'node_modules')),
      fs.remove(path.join(process.cwd(), 'bundles', 'npm-debug.log')),
      fs.remove(path.join(process.cwd(), 'bundles', 'yarn-error.log')),
      fs.remove(path.join(process.cwd(), 'bundles', '.idea')),
      fs.remove(path.join(process.cwd(), 'bundles', '.remote-sync.json')),
      fs.remove(path.join(process.cwd(), 'bundles', '.editorconfig')),
      fs.remove(path.join(process.cwd(), 'bundles', '.eslintrc.json')),
      fs.remove(path.join(process.cwd(), 'bundles', '.gitattributes')),
      fs.remove(path.join(process.cwd(), 'bundles', '.htaccess')),
      fs.remove(path.join(process.cwd(), 'bundles', '.gitignore')),
    ]);
  }

  // Put standard edenjs files into place
  await fs.copy(path.join(__dirname, '.eslintrc.json'), path.join(process.cwd(), '.eslintrc.json'));
  await fs.copy(path.join(__dirname, '.editorconfig'), path.join(process.cwd(), '.editorconfig'));

  // Put standard edenjs files into place if they dont exist
  if (!(await fs.pathExists(path.join(process.cwd(), '.gitignore')))) {
    await fs.copy(path.join(__dirname, '.gitignore'), path.join(process.cwd(), '.gitignore'));
  }

  if (!(await fs.pathExists(path.join(process.cwd(), '.gitattributes')))) {
    await fs.copy(path.join(__dirname, '.gitattributes'), path.join(process.cwd(), '.gitattributes'));
  }

  if (shouldMakeIntoApp && !hasConfig && !(await fs.pathExists(path.join(process.cwd(), 'config.js')))) {
    await fs.copy(path.join(__dirname, 'config.example.js'), path.join(process.cwd(), 'config.js'));
  }

  if (shouldMakeIntoModule && !(await fs.pathExists(path.join(process.cwd(), '.npmignore')))) {
    await fs.copy(path.join(__dirname, '.npmignore'), path.join(process.cwd(), '.npmignore'));
  }

  // Add to or create package.json
  let packageData = null;

  if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'bundles', 'package.json'))) {
    packageData = await fs.readJSON(path.join(process.cwd(), 'bundles', 'package.json'));
    await fs.remove(path.join(process.cwd(), 'bundles', 'package.json'));
  } else if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'package.json'))) {
    // Read existing package data
    packageData = await fs.readJSON(path.join(process.cwd(), 'package.json'));
  } else {
    // Default package data
    packageData = {
      name        : path.basename(process.cwd()),
      description : 'nothing yet',
      version     : '1.0.0',
      engines     : {
        node : '>= 8.0.0',
      },
    };
  }

  // Add our dev dependencies for eslint
  packageData.devDependencies = Object.assign({}, packageData.devDependencies, {
    '@edenjs/eslint-config-eden' : '^2.0.14',
    eslint                       : '^5.10.0',
    'eslint-config-airbnb'       : '^17.1.0',
    'eslint-plugin-import'       : '^2.14.0',
    'eslint-plugin-jsx-a11y'     : '^6.1.2',
    'eslint-plugin-react'        : '^7.11.1',
  });

  // Save new package data
  await fs.writeJSON(path.join(process.cwd(), 'package.json'), packageData, {
    spaces : 2,
  });

  // Migrate .git from bundles to cwd if requested
  if (migrateGit && dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'bundles', '.git')) && !(await fs.pathExists(path.join(process.cwd(), '.git')))) {
    await fs.move(path.join(process.cwd(), 'bundles', '.git'), path.join(process.cwd(), '.git'));
  }
}

(async () => {
  if (processArgs._[0] === 'build' || processArgs._[0] === 'run-dev') {
    console.log('Starting gulp');

    runGulp(processArgs._[0] === 'run-dev');
  }

  if (processArgs._[0] === 'run') {
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

    runEden(expressThreads, computeThreads);
  }

  if (processArgs._[0] === 'init') {
    initEden(processArgs.suppliedDirType, processArgs.migrateGit);
  }
})();
