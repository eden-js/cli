const fs   = require('fs-extra');
const path = require('path');
const glob = require('@edenjs/glob');

const commonBadFiles = [
  '.npmignore',
  'yarn.lock',
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
    if (await fs.pathExists(path.join(dir, 'app', 'bundles'))) {
      // Obvious and trustworthy
      return 'oldApp';
    }

    const configPath = path.join(dir, 'edenconfig.js');
    const oldAppConfigPath = path.join(dir, 'edenappconfig.js');
    const appConfigPath = path.join(dir, 'config.js');

    const configExists = await fs.pathExists(configPath);

    // eslint-disable-next-line max-len
    if (await fs.pathExists(oldAppConfigPath) || (configExists && await fs.pathExists(appConfigPath))) {
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

    if (await fs.pathExists(path.join(dir, 'bundles'))) {
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

    // Look files in the edenjs structure TODO maybe look for multiple different types together
    if ((await glob('./*/{controllers,models,views,daemons,helpers}/*.js')).length >= 3) {
      // Pretty safe
      return 'oldAppBundles';
    }

    if (configExists) {
      // Remember, apps can have this too, thats why this one is last
      return 'module';
    }

    // Look to see if there is anything javascript-like at all
    // obviously this must be very very last
    if ((await glob('./**/{node_modules,package.json,package-lock.json,*.js}')).length >= 3) {
      return 'none';
    }
  } catch (err) { /* */ }

  // We don't know what it is, lets not add a package.json to some random C++ project
  return 'danger';
}

async function initEden(suppliedDirType = null, migrateGit = false) {
  let dirType = await edenExistsIn(process.cwd());

  // If input for supplied dir type is empty and directory might be dangerous, throw an error
  if (dirType === 'danger' && suppliedDirType === null) {
    throw new Error('Directory type was detected as potentially dangerous to modify. Please manually specify a type if you are sure');
  }

  // Lets make things simpler now
  const inputDirType = suppliedDirType === 'none' ? null : suppliedDirType;

  const shouldMakeIntoApp = (inputDirType === null && (dirType === 'app' || dirType === 'oldApp' || dirType === 'oldAppBundles')) || inputDirType === 'app';
  const shouldMakeIntoModule = (inputDirType === null && dirType === 'module') || inputDirType === 'module';

  if (inputDirType === 'module' && shouldMakeIntoApp) {
    // This should be roughly ok, given apps are just more on top of a module
  }

  if (inputDirType === 'app' && shouldMakeIntoModule) {
    throw new Error('Turning apps into modules is currently unsupported');
  }

  // oldApp => app
  if (dirType === 'oldApp' && shouldMakeIntoApp) {
    // Move config and bundles to correct place
    await fs.move(path.join(process.cwd(), 'app', 'bundles'), path.join(process.cwd(), 'bundles'));

    if (await fs.pathExists(path.join(process.cwd(), 'app', 'config.js'))) {
      await fs.move(path.join(process.cwd(), 'app', 'config.js'), path.join(process.cwd(), 'config.js'));
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
      fs.remove(path.join(process.cwd(), 'node_modules')),

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
  await Promise.all(commonBadFiles.map(file => fs.remove(path.join(process.cwd(), file))));

  // Clean up directories which should be apps
  if (shouldMakeIntoApp) {
    // Clean the data directory
    await fs.ensureDir(path.join(process.cwd(), 'data'));

    // Move old config location to new location
    if (await fs.pathExists(path.join(process.cwd(), 'edenappconfig.js'))) {
      await fs.move(path.join(process.cwd(), 'edenappconfig.js'), path.join(process.cwd(), 'config.js'));
    }

    // Put default app config into apps without config
    if (!(await fs.pathExists(path.join(process.cwd(), 'config.js')))) {
      await fs.copy(path.join(__dirname, '..', '..', 'template', 'appconfig.js'), path.join(process.cwd(), 'config.js'));
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
      fs.remove(path.join(process.cwd(), 'bundles', 'package-lock.json')),
      fs.remove(path.join(process.cwd(), 'bundles', 'node_modules')),
      ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), 'bundles', file))),
    ]);
  }

  // Forcefully put standard edenjs files into place
  await fs.copy(path.join(__dirname, '..', '..', '.eslintrc.json'), path.join(process.cwd(), '.eslintrc.json'));
  await fs.copy(path.join(__dirname, '..', '..', '.editorconfig'), path.join(process.cwd(), '.editorconfig'));

  // Copy Dockerfile
  if (!(await fs.pathExists(path.join(process.cwd(), 'Dockerfile')))) {
    await fs.copy(path.join(__dirname, '..', '..', 'template', 'Dockerfile'), path.join(process.cwd(), 'Dockerfile'));
  }

  // Copy .dockerignore
  if (!(await fs.pathExists(path.join(process.cwd(), '.dockerignore')))) {
    await fs.copy(path.join(__dirname, '..', '..', 'template', '.dockerignore'), path.join(process.cwd(), '.dockerignore'));
  }

  // Copy kubernetes.yml
  if (!(await fs.pathExists(path.join(process.cwd(), 'kubernetes.yml')))) {
    await fs.copy(path.join(__dirname, '..', '..', 'template', 'kubernetes.yml'), path.join(process.cwd(), 'kubernetes.yml'));
  }

  // Copy docker-compse.yml
  if (!(await fs.pathExists(path.join(process.cwd(), 'docker-compose.yml')))) {
    await fs.copy(path.join(__dirname, '..', '..', 'template', 'docker-compose.yml'), path.join(process.cwd(), 'docker-compose.yml'));
  }

  // Copy gitlab-ci.yml
  if (!(await fs.pathExists(path.join(process.cwd(), '.gitlab-ci.yml')))) {
    await fs.copy(path.join(__dirname, '..', '..', 'template', '.gitlab-ci.yml'), path.join(process.cwd(), '.gitlab-ci.yml'));
  }

  // Copy travis.yml
  if (!(await fs.pathExists(path.join(process.cwd(), '.travis.yml')))) {
    await fs.copy(path.join(__dirname, '..', '..', 'template', '.travis.yml'), path.join(process.cwd(), '.travis.yml'));
  }

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

  // Look for a package.json regardless of any factor to ensure loss is avoided
  if (await fs.pathExists(path.join(process.cwd(), 'package.json'))) {
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
  if (shouldMakeIntoApp && packageData.dependencies['@edenjs/core'] === undefined) {
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
