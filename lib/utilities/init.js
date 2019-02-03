const fs = require('fs-extra');
const path = require('path');
const glob = require('@edenjs/glob');

const commonBadFiles = [
  '.npmignore',
  'yarn.lock',
  'node_modules',
  'npm-debug.log',
  'yarn-error.log',
  '.idea',
  '.remote-sync.json',
  '.editorconfig',
  '.eslintrc.json',
  '.htaccess',
];

async function edenExistsIn(dir) {
  try {
    const olderBundlesPath = path.join(dir, 'app', 'bundles');

    if (await fs.pathExists(olderBundlesPath)) {
      // Obvious and trustworthy
      return 'oldApp';
    }

    const appConfigPath = path.join(dir, 'edenappconfig.js');

    if (await fs.pathExists(appConfigPath)) {
      // Obvious and trustworthy
      return 'app';
    }

    const legacyConfigPath = path.join(dir, 'config.js');

    if (await fs.pathExists(legacyConfigPath)) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const configFile = require(legacyConfigPath);

      // Make sure its edenjs-like first
      if (typeof configFile === 'object' && typeof configFile.domain === 'string' && typeof configFile.version === 'string') {
        // Pretty safe
        return 'app';
      }
    }

    const rootJsPaths = await glob('./*.js');

    const bundlesPath = path.join(dir, 'bundles');

    if (await fs.pathExists(bundlesPath)) {
      if (rootJsPaths.length === 0) {
        // This is a bit of a gamble
        return 'module';
      } if (rootJsPaths.length === 1 && rootJsPaths[0] === 'index.js') {
        const indexText = await fs.readFile(path.join(dir, 'index.js'), 'utf8');

        if (indexText.match(/^\/\/ EdenJS module does not require an index$/m)) {
          // Obvious and trustworthy
          return 'module';
        }
      }
    }

    const edenStructuredFiles = await glob('./*/{controllers,models,views,daemons,helpers}/*.js');

    if (edenStructuredFiles.length > 3) {
      // Pretty safe
      return 'oldAppBundles';
    }

    const configPath = path.join(dir, 'edenconfig.js');

    if (await fs.pathExists(configPath)) {
      // Remember, apps can have this too, thats why this one is last
      return 'module';
    }
  } catch (err) { /* */ }

  return 'none';
}

async function initEden(suppliedDirType = null, migrateGit = false) {
  // Lets make things simple
  if (suppliedDirType === 'none') suppliedDirType = null;

  let dirType = await edenExistsIn(process.cwd());

  const shouldMakeIntoApp = (suppliedDirType === null && (dirType === 'app' || dirType === 'oldApp' || dirType === 'oldAppBundles')) || suppliedDirType === 'app';
  const shouldMakeIntoModule = (suppliedDirType === null && dirType === 'module') || suppliedDirType === 'module';

  if (suppliedDirType === 'module' && shouldMakeIntoApp) {
    // This should be roughly ok, given apps are just more on top of a module
  }

  if (suppliedDirType === 'app' && shouldMakeIntoModule) {
    throw new Error('Turning apps into modules is currently unsupported');
  }

  // oldApp => app
  if (dirType === 'oldApp' && shouldMakeIntoApp) {
    // Move config and bundles to correct place
    await fs.move(path.join(process.cwd(), 'app', 'bundles'), path.join(process.cwd(), 'bundles'));

    if (await fs.pathExists(path.join(process.cwd(), 'app', 'config.js'))) {
      await fs.move(path.join(process.cwd(), 'app', 'config.js'), path.join(process.cwd(), 'edenappconfig.js'));
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
      fs.remove(path.join(process.cwd(), '.gitignore')),
      fs.remove(path.join(process.cwd(), '.gitattributes')),

      ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), file))),
    ]);

    dirType = 'app';
  }

  // oldAppBundles => app
  if (dirType === 'oldAppBundles' && shouldMakeIntoApp) {
    const paths = await glob(['./*'], {
      nodir : false,
    });

    await fs.ensureDir(path.join(process.cwd(), 'bundles'));

    for (const p of paths) {
      await fs.move(path.join(process.cwd(), p), path.join(process.cwd(), 'bundles', p));
    }

    dirType = 'app';
  }

  // Remove common junk
  await Promise.all([
    ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), file))),
  ]);

  // Clean up directories which should be apps
  if (shouldMakeIntoApp) {
    // Clean the data directory
    await fs.ensureDir(path.join(process.cwd(), 'data'));

    // Move old config location to new location
    if (await fs.pathExists(path.join(process.cwd(), 'config.js'))) {
      await fs.move(path.join(process.cwd(), 'config.js'), path.join(process.cwd(), 'edenappconfig.js'));
    }

    // Put default app config into apps without config
    if (!(await fs.pathExists(path.join(process.cwd(), 'edenappconfig.js')))) {
      await fs.copy(path.join(__dirname, '..', '..', 'template', 'appconfig.js'), path.join(process.cwd(), 'edenappconfig.js'));
    }
  }

  // If either EdenJS type, create a bundles directory for code
  if ((shouldMakeIntoApp || shouldMakeIntoModule) && !(await fs.pathExists(path.join(process.cwd(), 'bundles')))) {
    await fs.mkdir(path.join(process.cwd(), 'bundles'));
  }

  // If directory type currently isn't none, clean up bundles
  if (dirType !== 'none') {
    await Promise.all([
      fs.remove(path.join(process.cwd(), 'bundles', 'package.json')),
      ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), 'bundles', file))),
    ]);
  }

  // Forcefully put standard edenjs files into place
  await fs.copy(path.join(__dirname, '..', '..', '.eslintrc.json'), path.join(process.cwd(), '.eslintrc.json'));
  await fs.copy(path.join(__dirname, '..', '..', '.editorconfig'), path.join(process.cwd(), '.editorconfig'));

  // Put standard edenjs files into place if they dont exist
  if (!(await fs.pathExists(path.join(process.cwd(), '.gitignore')))) {
    await fs.copy(path.join(__dirname, '..', '..', 'template', 'gitignore'), path.join(process.cwd(), '.gitignore'));
  }

  if (!(await fs.pathExists(path.join(process.cwd(), '.gitattributes')))) {
    await fs.copy(path.join(__dirname, '..', '..', '.gitattributes'), path.join(process.cwd(), '.gitattributes'));
  }

  // Make sure any EdenJS type has an edenconfig.js (good for identification too)
  if ((shouldMakeIntoApp || shouldMakeIntoModule) && !(await fs.pathExists(path.join(process.cwd(), 'edenconfig.js')))) {
    fs.copy(path.join(__dirname, '..', '..', 'template', 'emptyconfig.js'), path.join(process.cwd(), 'edenconfig.js'));
  }

  // Add to or create package.json
  let packageData = {};

  if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'package.json'))) {
    // Read existing package data
    packageData = await fs.readJSON(path.join(process.cwd(), 'package.json'));
  }

  // Apply default data
  packageData = Object.assign({}, {
    name         : path.basename(process.cwd()),
    description  : 'nothing yet',
    version      : '1.0.0',
    dependencies : {},
    engines      : {
      node : '>= 8.0.0',
    },
  }, packageData);

  // Add core dependency if is missing from app
  if (dirType === 'app' && packageData.dependencies['@edenjs/core'] === undefined) {
    packageData.dependencies['@edenjs/core'] = 'latest';
  }

  const edenPackageData = await fs.readJSON(path.join(__dirname, '..', '..', 'package.json'));

  // Add our dev dependencies for eslint
  packageData.devDependencies = Object.assign({}, packageData.devDependencies, {
    eslint                       : edenPackageData.devDependencies.eslint,
    '@edenjs/eslint-config-eden' : edenPackageData.devDependencies['@edenjs/eslint-config-eden'],
    'eslint-config-airbnb'       : edenPackageData.devDependencies['eslint-config-airbnb'],
    'eslint-plugin-import'       : edenPackageData.devDependencies['eslint-plugin-import'],
    'eslint-plugin-jsx-a11y'     : edenPackageData.devDependencies['eslint-plugin-jsx-a11y'],
    'eslint-plugin-react'        : edenPackageData.devDependencies['eslint-plugin-react'],
  });

  // Save new package data
  await fs.writeJSON(path.join(process.cwd(), 'package.json'), packageData, {
    spaces : 2,
  });

  // Migrate .git from bundles to cwd if requested
  if (migrateGit && dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'bundles', '.git')) && !(await fs.pathExists(path.join(process.cwd(), '.git')))) {
    await fs.move(path.join(process.cwd(), 'bundles', '.git'), path.join(process.cwd(), '.git'));
  }

  return (suppliedDirType || dirType);
}

module.exports = initEden;
